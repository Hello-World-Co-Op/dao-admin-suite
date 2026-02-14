/**
 * Blog Editor Page - Production Editor Component
 *
 * Full-featured blog editor with:
 * - Progressive toolbar (minimal default + overflow menu for advanced tools)
 * - BubbleMenu for inline formatting on text selection
 * - Slash commands for block insertion (/image, /code, /quote, /hr)
 * - Paste handling with cleaning notifications
 * - Code block syntax highlighting with 4 pinned languages
 * - Placeholder localStorage save (full canister save in Story 3.3)
 *
 * Code-split via React.lazy() with Suspense fallback for LCP < 2.5s (NFR2).
 * Editor chunk must remain under 200KB gzip (NFR7).
 *
 * highlight.js@11.11.1 pinned for visual parity with marketing-suite (Story 5.2).
 *
 * @see BL-008.3.2 - Blog Editor Core -- Rich-Text Editing and Formatting
 * @see BL-008.3.1 - Tiptap Spike (foundation)
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
 * Get the localStorage key for draft content.
 * Uses pattern: blog-draft-{postId} or blog-draft-new for new posts.
 *
 * TODO: Story 3.3 (BL-008.3.3) - Replace localStorage with canister save via oracle-bridge
 */
function getDraftKey(postId?: string): string {
  return postId ? `blog-draft-${postId}` : 'blog-draft-new';
}

/**
 * Load draft content from localStorage.
 *
 * TODO: Story 3.3 (BL-008.3.3) - Load from canister instead of localStorage
 */
function loadDraft(postId?: string): string {
  const key = getDraftKey(postId);
  return localStorage.getItem(key) || '';
}

/**
 * Production blog editor page.
 *
 * Routes:
 * - /blog/editor/new - Create new post
 * - /blog/editor/:id - Edit existing post
 */
export default function BlogEditorPage() {
  const { id: postId } = useParams();
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pasteCleanedRef = useRef(false);

  // Show toast notification
  const showToast = useCallback((message: string) => {
    // Clear any existing timer
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

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Load saved draft content
  const initialContent = loadDraft(postId);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the default code block since we use CodeBlockLowlight
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
    content: initialContent || '<p>Start writing your blog post...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none',
        'data-testid': 'blog-editor',
      },
      // Paste handling: detect when content is cleaned/simplified (AC5)
      handlePaste: (_view, event) => {
        const html = event.clipboardData?.getData('text/html');
        if (html) {
          // Check for signs of rich content that will be cleaned:
          // Google Docs, Word, Notion all add metadata, styles, spans, font tags
          const hasRichFormatting =
            html.includes('style=') ||
            html.includes('<font') ||
            html.includes('<span') ||
            html.includes('class="') ||
            html.includes('MsoNormal') ||
            html.includes('docs-internal') ||
            html.includes('notion-');

          if (hasRichFormatting) {
            // Mark that paste cleaning occurred - Tiptap will handle the actual paste
            pasteCleanedRef.current = true;
          }
        }
        // Return false to let Tiptap handle the paste with its built-in cleaning
        return false;
      },
    },
    // After Tiptap processes the paste, show notification if content was cleaned
    onUpdate: () => {
      if (pasteCleanedRef.current) {
        pasteCleanedRef.current = false;
        showToast('Some formatting was simplified.');
      }
    },
  });

  // Save draft to localStorage
  const handleSaveDraft = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const key = getDraftKey(postId);
    localStorage.setItem(key, html);
    showToast('Draft saved to browser storage (temporary)');
  }, [editor, postId, showToast]);

  return (
    <div className="max-w-4xl mx-auto p-4" data-testid="blog-editor-page">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {postId ? 'Edit Post' : 'New Blog Post'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {/* TODO: Story 3.3 (BL-008.3.3) - Add metadata panel (excerpt, categories, tags) */}
            Use the toolbar, slash commands (/), or select text for formatting options.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveDraft}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Save draft"
        >
          Save Draft
        </button>
      </div>

      {/* Editor container */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <EditorToolbar editor={editor} />
        {editor && <EditorBubbleMenu editor={editor} />}
        <EditorContent editor={editor} />
      </div>

      {/* Toast notification (AC5: paste cleaning notification) */}
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
