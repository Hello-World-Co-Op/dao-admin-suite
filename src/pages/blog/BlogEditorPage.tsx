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
 *
 * Code-split via React.lazy() with Suspense fallback for LCP < 2.5s (NFR2).
 * Editor chunk must remain under 200KB gzip (NFR7).
 *
 * highlight.js@11.11.1 pinned for visual parity with marketing-suite (Story 5.2).
 *
 * @see BL-008.3.2 - Blog Editor Core -- Rich-Text Editing and Formatting
 * @see BL-008.3.3 - Post Creation Form and Metadata Panel
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
import { generateSlug } from '@/utils/slug-generator';
import { calculateReadingTime } from '@/utils/reading-time';
import { generateAutoExcerpt } from '@/utils/auto-excerpt';

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

/** Stale edit banner state */
interface StaleEditState {
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
  const [staleEdit, setStaleEdit] = useState<StaleEditState>({ visible: false, message: '' });
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

  // Load existing post on mount (Task 18)
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
    if (staleEdit.visible) return; // Don't save if stale edit detected

    setSaving(true);
    const body = editor.getHTML();

    try {
      if (currentPostId) {
        // Existing post: use save_draft (Task 19)
        const response = await fetch(`${oracleBridgeUrl}/api/blog/save-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: currentPostId,
            body,
            expected_updated_at: updatedAt,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          if (response.status === 409 && data.message?.includes('modified in another session')) {
            setStaleEdit({
              visible: true,
              message: data.message,
            });
          } else {
            showToast(data.message || 'Failed to save draft');
          }
          return;
        }

        setUpdatedAt(data.updated_at);
        showToast('Draft saved successfully');
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
        // Update URL to edit mode (Task 7.6)
        navigate(`/blog/editor/${slug || data.id}`, { replace: true });
      }
    } catch (error) {
      console.error('[BlogEditor] Save error:', error);
      showToast('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [editor, title, slug, currentPostId, updatedAt, oracleBridgeUrl, navigate, showToast, staleEdit.visible]);

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
          setStaleEdit({ visible: true, message: data.message });
        } else {
          showToast(data.message || 'Failed to update metadata');
        }
        return;
      }

      setUpdatedAt(data.updated_at);
      setSlugError(null);
    } catch (error) {
      console.error('[BlogEditor] Metadata update error:', error);
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
      {/* Stale Edit Banner (Task 19.4) */}
      {staleEdit.visible && (
        <div
          className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center justify-between"
          role="alert"
          data-testid="stale-edit-banner"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-yellow-800">{staleEdit.message}</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm text-yellow-800 underline hover:text-yellow-900"
          >
            Reload
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentPostId || postId ? 'Edit Post' : 'New Blog Post'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Use the toolbar, slash commands (/), or select text for formatting options.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving || staleEdit.visible}
          className={`px-4 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            saving || staleEdit.visible
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
