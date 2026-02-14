/**
 * Progressive Editor Toolbar
 *
 * Implements a two-tier toolbar for the blog editor:
 * - Default tools (always visible): bold, italic, heading (H2/H3), link, image,
 *   ordered list, unordered list
 * - Advanced tools (overflow menu): code blocks, blockquotes
 *
 * All buttons have ARIA labels and are keyboard-accessible (NFR26).
 * The toolbar container has role="toolbar" with an accessible label.
 *
 * @see BL-008.3.2 AC2 - Progressive toolbar with accessibility
 */

import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { LanguageSelector } from './LanguageSelector';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}

/** Toolbar button with active state styling, ARIA label, and keyboard accessibility */
function ToolbarButton({ onClick, isActive, disabled, children, ariaLabel }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`px-2 py-1 text-sm rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
        isActive
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}

interface EditorToolbarProps {
  editor: Editor | null;
  /** Called when the image toolbar button is clicked (opens file picker + alt text flow) */
  onImageUpload?: () => void;
}

/**
 * Progressive toolbar with minimal default tools and an overflow menu for advanced tools.
 *
 * Default (always visible): Bold, Italic, H2, H3, Link, Image, UL, OL
 * Overflow (dropdown): Code Block, Blockquote
 *
 * Language selector appears when cursor is inside a code block.
 */
export function EditorToolbar({ editor, onImageUpload }: EditorToolbarProps) {
  const [overflowOpen, setOverflowOpen] = useState(false);

  const toggleOverflow = useCallback(() => {
    setOverflowOpen((prev) => !prev);
  }, []);

  const closeOverflow = useCallback(() => {
    setOverflowOpen(false);
  }, []);

  if (!editor) return null;

  const isCodeBlock = editor.isActive('codeBlock');
  const currentLanguage = isCodeBlock
    ? (editor.getAttributes('codeBlock').language as string | null)
    : null;

  const handleAddLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleAddImage = () => {
    if (onImageUpload) {
      onImageUpload();
    } else {
      // Fallback to prompt if no upload handler provided
      const url = window.prompt('Enter image URL:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50"
      role="toolbar"
      aria-label="Editor formatting toolbar"
    >
      {/* Inline formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        ariaLabel="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        ariaLabel="Italic (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300 mx-1" role="separator" aria-orientation="vertical" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        ariaLabel="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        ariaLabel="Heading 3"
      >
        H3
      </ToolbarButton>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300 mx-1" role="separator" aria-orientation="vertical" />

      {/* Link */}
      <ToolbarButton
        onClick={handleAddLink}
        isActive={editor.isActive('link')}
        ariaLabel="Insert link"
      >
        Link
      </ToolbarButton>

      {/* Image */}
      <ToolbarButton
        onClick={handleAddImage}
        ariaLabel="Insert image"
      >
        Image
      </ToolbarButton>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300 mx-1" role="separator" aria-orientation="vertical" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        ariaLabel="Unordered list"
      >
        UL
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        ariaLabel="Ordered list"
      >
        OL
      </ToolbarButton>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300 mx-1" role="separator" aria-orientation="vertical" />

      {/* Overflow menu for advanced tools */}
      <div className="relative">
        <ToolbarButton
          onClick={toggleOverflow}
          ariaLabel="More formatting options"
        >
          More...
        </ToolbarButton>
        {overflowOpen && (
          <div
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]"
            role="menu"
            aria-label="Advanced formatting options"
          >
            <button
              type="button"
              role="menuitem"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                editor.isActive('codeBlock') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
              onClick={() => {
                editor.chain().focus().toggleCodeBlock().run();
                closeOverflow();
              }}
              aria-label="Code block"
            >
              Code Block
            </button>
            <button
              type="button"
              role="menuitem"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                editor.isActive('blockquote') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
              onClick={() => {
                editor.chain().focus().toggleBlockquote().run();
                closeOverflow();
              }}
              aria-label="Blockquote"
            >
              Blockquote
            </button>
          </div>
        )}
      </div>

      {/* Language selector (visible when in code block) */}
      {isCodeBlock && (
        <>
          <div className="w-px h-6 bg-gray-300 mx-1" role="separator" aria-orientation="vertical" />
          <LanguageSelector
            currentLanguage={currentLanguage}
            onSelect={(lang) => {
              editor.chain().focus().updateAttributes('codeBlock', { language: lang }).run();
            }}
          />
        </>
      )}
    </div>
  );
}
