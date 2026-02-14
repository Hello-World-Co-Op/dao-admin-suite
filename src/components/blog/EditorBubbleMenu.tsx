/**
 * Editor BubbleMenu - Inline Formatting Toolbar
 *
 * A floating toolbar that appears when text is selected in the editor.
 * Provides quick access to inline formatting: bold, italic, and link.
 *
 * Styled with dark background and white text for a floating toolbar aesthetic.
 * Uses Tiptap's BubbleMenu extension for positioning above selected text.
 *
 * @see BL-008.3.2 AC3 - BubbleMenu for inline formatting
 */

import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';

interface EditorBubbleMenuProps {
  editor: Editor;
}

/**
 * Floating BubbleMenu with bold, italic, and link buttons.
 * Only appears when text is selected (not on empty selections).
 */
export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const handleAddLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL:', previousUrl || '');
    if (url === null) return; // User cancelled
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: ed, from, to }) => {
        // Only show when there is a text selection (not empty)
        if (from === to) return false;
        // Don't show in code blocks
        if (ed.isActive('codeBlock')) return false;
        return true;
      }}
    >
      <div
        className="flex items-center gap-1 px-2 py-1 bg-gray-900 rounded-lg shadow-lg"
        role="toolbar"
        aria-label="Inline formatting"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
          aria-pressed={editor.isActive('bold')}
          className={`px-2 py-1 text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            editor.isActive('bold')
              ? 'bg-blue-600 text-white'
              : 'text-gray-200 hover:bg-gray-700'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
          aria-pressed={editor.isActive('italic')}
          className={`px-2 py-1 text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            editor.isActive('italic')
              ? 'bg-blue-600 text-white'
              : 'text-gray-200 hover:bg-gray-700'
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={handleAddLink}
          aria-label="Link"
          aria-pressed={editor.isActive('link')}
          className={`px-2 py-1 text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            editor.isActive('link')
              ? 'bg-blue-600 text-white'
              : 'text-gray-200 hover:bg-gray-700'
          }`}
        >
          Link
        </button>
      </div>
    </BubbleMenu>
  );
}
