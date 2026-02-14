/**
 * Blog Editor Page - Production Editor Component
 *
 * Full-featured blog editor with:
 * - TitleField with validation and slug auto-generation (Story 3.3)
 * - Progressive toolbar (minimal default + overflow menu for advanced tools)
 * - BubbleMenu for inline formatting on text selection
 * - Slash commands for block insertion (/image, /code, /quote, /hr)
 * - Paste handling with cleaning notifications
 * - Code block syntax highlighting with 4 pinned languages
 * - MetadataPanel with slug, excerpt, categories, tags, SEO preview (Story 3.3)
 * - Save via oracle-bridge to blog canister (Story 3.3)
 * - Auto-save with trailing debounce (60s) + max-wait (5min) (Story 3.4)
 * - Crash recovery via localStorage backup (Story 3.4)
 * - Save status indicators with ARIA live regions (Story 3.4)
 * - StaleEdit conflict detection and persistent banner (Story 3.4)
 * - Inline re-auth prompt on session expiry (Story 3.4)
 *
 * Code-split via React.lazy() with Suspense fallback for LCP < 2.5s (NFR2).
 * Editor chunk must remain under 200KB gzip (NFR7).
 *
 * highlight.js@11.11.1 pinned for visual parity with marketing-suite (Story 5.2).
 *
 * @see BL-008.3.2 - Blog Editor Core -- Rich-Text Editing and Formatting
 * @see BL-008.3.3 - Post Creation Form and Metadata Panel
 * @see BL-008.3.4 - Auto-Save, Crash Recovery, and Save Indicators
 */

import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import rust from 'highlight.js/lib/languages/rust';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bashLang from 'highlight.js/lib/languages/bash';

import { EditorToolbar } from '@/components/blog/EditorToolbar';
import { EditorBubbleMenu } from '@/components/blog/EditorBubbleMenu';
import { SlashCommands } from '@/components/blog/SlashCommandMenu';
import { TitleField } from '@/components/blog/TitleField';
import { MetadataPanel } from '@/components/blog/MetadataPanel';
import { SaveStatusIndicator } from '@/components/blog/SaveStatusIndicator';
import { PersistentBanner } from '@/components/blog/PersistentBanner';
import { RecoveryPrompt } from '@/components/blog/RecoveryPrompt';
import { checkForRecovery, clearBackup } from '@/utils/recovery';
import { InlineReAuthPrompt } from '@/components/blog/InlineReAuthPrompt';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { SaveStatus } from '@/hooks/useAutoSave';
import { generateSlug } from '@/utils/slug-generator';
import { calculateReadingTime } from '@/utils/reading-time';
import { generateAutoExcerpt } from '@/utils/auto-excerpt';
import { saveDraft } from '@/utils/blogApi';

// Register ONLY 4 languages (not common's 37 or all 190+) to minimize bundle size
// highlight.js@11.11.1 pinned for marketing-suite visual parity (Story 5.2)
const lowlight = createLowlight();
lowlight.register('rust', rust);
lowlight.register('typescript', typescript);
lowlight.register('json', json);
lowlight.register('bash', bashLang);

/** Toast notification state */
interface ToastState {
  visible: boolean;
  message: string;
}

/**
 * Get the oracle-bridge base URL from Vite env vars.
 */
function getOracleBridgeUrl(): string {
  return import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
}

/**
 * Production blog editor page.
 *
 * Routes:
 * - /blog/editor/new - Create new post
 * - /blog/editor/:id - Edit existing post (id = slug)
 */
export default function BlogEditorPage() {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pasteCleanedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Post metadata state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [readingTime, setReadingTime] = useState(0);
  const [autoExcerpt, setAutoExcerpt] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [isPublished, setIsPublished] = useState(false);

  // Auto-save state (Story 3.4)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveMessage, setSaveMessage] = useState<string | undefined>();
  const [staleEditMessage, setStaleEditMessage] = useState<string>('');
  const [showStaleEdit, setShowStaleEdit] = useState(false);
  const [showReAuthPrompt, setShowReAuthPrompt] = useState(false);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveryBody, setRecoveryBody] = useState<string>('');

  const oracleBridgeUrl = useMemo(() => getOracleBridgeUrl(), []);

  // Show toast notification
  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 5000);
  }, []);

  // Dismiss toast
  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ visible: false, message: '' });
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'typescript',
      }),
      SlashCommands,
    ],
    content: '<p>Start writing your blog post...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none',
        'data-testid': 'blog-editor',
      },
      handlePaste: (_view, event) => {
        const html = event.clipboardData?.getData('text/html');
        if (html) {
          const hasRichFormatting =
            html.includes('style=') ||
            html.includes('<font') ||
            html.includes('<span') ||
            html.includes('class="') ||
            html.includes('MsoNormal') ||
            html.includes('docs-internal') ||
            html.includes('notion-');

          if (hasRichFormatting) {
            pasteCleanedRef.current = true;
          }
        }
        return false;
      },
    },
    onUpdate: () => {
      if (pasteCleanedRef.current) {
        pasteCleanedRef.current = false;
        showToast('Some formatting was simplified. Review changes in the editor.');
      }
    },
  });

  // Auto-save hook (Story 3.4 - Task 1)
  const { markDirty, triggerSave } = useAutoSave({
    postId: currentPostId,
    expectedUpdatedAt: updatedAt,
    getContent: () => editor?.getHTML() || '',
    saveFn: async (body, expectedUpdatedAtValue) => {
      if (currentPostId === null) {
        return { success: false, error: 'InternalError', message: 'No post ID' };
      }
      return saveDraft(oracleBridgeUrl, currentPostId, body, expectedUpdatedAtValue);
    },
    onSaveSuccess: (newUpdatedAt) => {
      setUpdatedAt(newUpdatedAt);
    },
    onStatusChange: (status, message) => {
      setSaveStatus(status);
      setSaveMessage(message);

      if (status === 'stale') {
        setShowStaleEdit(true);
        setStaleEditMessage(message || 'This post was modified in another session. Reload to see latest changes.');
      }

      if (status === 'unauthorized') {
        setShowReAuthPrompt(true);
      }
    },
    enabled: currentPostId !== null && !showStaleEdit,
  });

  // Hook into Tiptap onUpdate for auto-save dirty tracking (Task 1.2)
  useEffect(() => {
    if (!editor) return;

    const handleEditorUpdate = () => {
      markDirty();
    };

    editor.on('update', handleEditorUpdate);
    return () => {
      editor.off('update', handleEditorUpdate);
    };
  }, [editor, markDirty]);

  // Debounced reading time and auto-excerpt update (Task 17)
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        const html = editor.getHTML();
        setReadingTime(calculateReadingTime(html));
        setAutoExcerpt(generateAutoExcerpt(html));
      }, 500);
    };

    editor.on('update', handleUpdate);
    // Calculate initial values
    handleUpdate();

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  // Load existing post on mount (Task 18) + crash recovery check (Task 4)
  useEffect(() => {
    if (!postId || postId === 'new') return;

    async function loadPost() {
      setLoading(true);
      try {
        const response = await fetch(`${oracleBridgeUrl}/api/blog/post/${postId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          showToast(errData.message || 'Failed to load post');
          navigate('/blog/editor/new');
          return;
        }

        const post = await response.json();
        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt || '');
        setCategories(post.categories || []);
        setTags(post.tags || []);
        setCurrentPostId(post.id);
        setUpdatedAt(post.updated_at);
        setIsPublished(post.status === 'Published');

        if (editor && post.body) {
          editor.commands.setContent(post.body);
        }

        // Check for crash recovery (Story 3.4 - Task 4)
        if (post.id) {
          const recovery = checkForRecovery(post.id, post.updated_at);
          if (recovery) {
            setRecoveryBody(recovery.body);
            setShowRecoveryPrompt(true);
          }
        }
      } catch (error) {
        console.error('[BlogEditor] Failed to load post:', error);
        showToast('Failed to load post');
        navigate('/blog/editor/new');
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postId, oracleBridgeUrl, editor, navigate, showToast]);

  // Handle recovery actions (Task 4.9, 4.10)
  const handleRecover = useCallback(() => {
    if (editor && recoveryBody) {
      editor.commands.setContent(recoveryBody);
    }
    setShowRecoveryPrompt(false);
    setRecoveryBody('');
  }, [editor, recoveryBody]);

  const handleDiscardRecovery = useCallback(() => {
    if (currentPostId !== null) {
      clearBackup(currentPostId);
    }
    setShowRecoveryPrompt(false);
    setRecoveryBody('');
  }, [currentPostId]);

  // Handle re-auth (Task 5)
  const handleReAuth = useCallback(() => {
    // Open auth in a new window to preserve editor content
    const authWindow = window.open('/login?reauth=true', '_blank', 'width=500,height=600');

    // Poll for auth window close and retry save
    const checkInterval = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkInterval);
        setShowReAuthPrompt(false);
        setSaveStatus('idle');
        // Retry the save after re-auth
        triggerSave();
      }
    }, 500);

    // Clean up after 5 minutes max
    setTimeout(() => clearInterval(checkInterval), 300_000);
  }, [triggerSave]);

  const handleDismissReAuth = useCallback(() => {
    setShowReAuthPrompt(false);
    setSaveStatus('idle');
  }, []);

  // Handle title blur: auto-generate slug if empty (Task 6.5)
  const handleTitleBlur = useCallback(() => {
    if (!slug && title) {
      setSlug(generateSlug(title));
    }
  }, [slug, title]);

  // Save draft handler (Task 7 + Task 19)
  const handleSaveDraft = useCallback(async () => {
    if (!editor) return;
    if (!title.trim()) {
      showToast('Please enter a title before saving');
      return;
    }
    if (showStaleEdit) return; // Don't save if stale edit detected

    setSaving(true);
    const body = editor.getHTML();

    try {
      if (currentPostId) {
        // Existing post: use save_draft (Task 19)
        const result = await saveDraft(oracleBridgeUrl, currentPostId, body, updatedAt);

        if (result.success && result.updated_at !== undefined) {
          setUpdatedAt(result.updated_at);
          showToast('Draft saved successfully');
        } else if (result.error === 'StaleEdit') {
          setShowStaleEdit(true);
          setStaleEditMessage(result.message || 'This post was modified in another session. Reload to see latest changes.');
        } else if (result.error === 'Unauthorized') {
          setShowReAuthPrompt(true);
        } else {
          showToast(result.message || 'Failed to save draft');
        }
      } else {
        // New post: use create_post (Task 7)
        const response = await fetch(`${oracleBridgeUrl}/api/blog/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title, body }),
        });

        const data = await response.json();
        if (!response.ok) {
          showToast(data.message || 'Failed to create post');
          return;
        }

        setCurrentPostId(data.id);
        showToast('Draft saved successfully');
        navigate(`/blog/editor/${data.id}`, { replace: true });
      }
    } catch (error) {
      console.error('[BlogEditor] Save error:', error);
      showToast('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [editor, title, currentPostId, updatedAt, oracleBridgeUrl, navigate, showToast, showStaleEdit]);

  // Update metadata via canister (Task 20)
  const handleMetadataUpdate = useCallback(async () => {
    if (!currentPostId || !updatedAt) return;

    try {
      const response = await fetch(`${oracleBridgeUrl}/api/blog/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: currentPostId,
          title,
          slug,
          excerpt: excerpt || undefined,
          categories: categories.length > 0 ? categories : undefined,
          tags: tags.length > 0 ? tags : undefined,
          expected_updated_at: updatedAt,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409 && data.message?.includes('slug')) {
          setSlugError(data.message);
        } else if (response.status === 409) {
          setShowStaleEdit(true);
          setStaleEditMessage(data.message);
        } else {
          showToast(data.message || 'Failed to update metadata');
        }
        return;
      }

      setUpdatedAt(data.updated_at);
      setSlugError(null);
      showToast('Metadata saved');
    } catch (error) {
      console.error('[BlogEditor] Metadata update error:', error);
      showToast('Failed to save metadata. Please try again.');
    }
  }, [currentPostId, updatedAt, oracleBridgeUrl, title, slug, excerpt, categories, tags, showToast]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4" data-testid="blog-editor-page">
      {/* Persistent Banner for StaleEdit (Story 3.4 - AC4) */}
      <PersistentBanner
        visible={showStaleEdit}
        message={staleEditMessage}
      />

      {/* Recovery Prompt for crash recovery (Story 3.4 - AC7) */}
      <RecoveryPrompt
        visible={showRecoveryPrompt}
        onRecover={handleRecover}
        onDiscard={handleDiscardRecovery}
      />

      {/* Inline Re-Auth Prompt (Story 3.4 - AC8) */}
      <InlineReAuthPrompt
        visible={showReAuthPrompt}
        onReAuth={handleReAuth}
        onDismiss={handleDismissReAuth}
      />

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentPostId || postId ? 'Edit Post' : 'New Blog Post'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Use the toolbar, slash commands (/), or select text for formatting options.
          </p>
          {/* Save Status Indicator (Story 3.4 - AC3, AC5) */}
          <SaveStatusIndicator
            status={saveStatus}
            message={saveMessage}
            onRetry={triggerSave}
          />
        </div>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving || showStaleEdit}
          className={`px-4 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            saving || showStaleEdit
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          aria-label="Save draft"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>

      {/* Main content area: editor + metadata panel */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Editor column */}
        <div className="flex-1 min-w-0">
          {/* Title Field (Task 5 + 6) */}
          <TitleField
            value={title}
            onChange={setTitle}
            onBlur={handleTitleBlur}
            disabled={isPublished}
          />

          {/* Editor container */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <EditorToolbar editor={editor} />
            {editor && <EditorBubbleMenu editor={editor} />}
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Metadata Panel (Task 8 + 14) - sidebar on desktop, below on mobile */}
        <div className="w-full lg:w-80 lg:sticky lg:top-4 lg:self-start">
          <MetadataPanel
            title={title}
            slug={slug}
            onSlugChange={setSlug}
            excerpt={excerpt}
            onExcerptChange={setExcerpt}
            autoExcerpt={autoExcerpt}
            categories={categories}
            onCategoriesChange={setCategories}
            tags={tags}
            onTagsChange={setTags}
            readingTime={readingTime}
            isPublished={isPublished}
            isExpanded={!!currentPostId}
            slugError={slugError}
            oracleBridgeUrl={oracleBridgeUrl}
            onMetadataBlur={handleMetadataUpdate}
          />
        </div>
      </div>

      {/* Toast notification */}
      {toast.visible && (
        <div
          className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
          role="status"
          aria-live="polite"
          data-testid="editor-toast"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={dismissToast}
            className="text-gray-400 hover:text-white text-sm underline focus:outline-none"
            aria-label="Dismiss notification"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
