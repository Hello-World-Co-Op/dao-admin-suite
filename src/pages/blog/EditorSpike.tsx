/**
 * Blog Editor Spike - Tiptap Feasibility Validation
 *
 * This is a temporary spike component for validating Tiptap's suitability
 * for the blog editor. It tests:
 * - Bundle size with StarterKit + Image + CodeBlockLowlight
 * - Paste handling from external sources (Google Docs, Word, Notion)
 * - Code block syntax highlighting with selective language loading
 * - HTML tag enumeration for canister-side sanitizer allowlist
 * - Mobile/tablet usability
 *
 * NOT for production use. Will be replaced by BlogEditorPage in Story 3.2.
 *
 * @see BL-008.3.1 - Tiptap Spike -- Editor Feasibility Validation
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import rust from 'highlight.js/lib/languages/rust';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import { useState, useCallback } from 'react';

// Register ONLY 4 languages (not common's 37 or all 190+) to minimize bundle size
const lowlight = createLowlight();
lowlight.register('rust', rust);
lowlight.register('typescript', typescript);
lowlight.register('json', json);
lowlight.register('bash', bash);

/** Languages available in the code block language selector */
export const SUPPORTED_LANGUAGES = ['rust', 'typescript', 'json', 'bash'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * HTML tags and attributes output by Tiptap with our extension configuration.
 * This enumeration directly scopes the canister-side sanitizer allowlist (Story 1.3).
 */
export const TIPTAP_HTML_ALLOWLIST = {
  // Block elements
  p: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  blockquote: [],
  pre: [],
  hr: [],

  // List elements
  ul: [],
  ol: ['start'],
  li: [],

  // Inline elements
  strong: [],
  em: [],
  s: [],
  code: ['class'], // class="language-*" for code blocks
  a: ['href', 'target', 'rel'],
  br: [],

  // Media
  img: ['src', 'alt', 'title'],
} as const;

/** Props for the toolbar button component */
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

/** Simple toolbar button with active state styling */
function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 text-sm rounded border transition-colors ${
        isActive
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}

/** Language selector dropdown for code blocks */
function LanguageSelector({
  currentLanguage,
  onSelect,
}: {
  currentLanguage: string | null;
  onSelect: (lang: string) => void;
}) {
  return (
    <select
      value={currentLanguage || ''}
      onChange={(e) => onSelect(e.target.value)}
      className="px-2 py-1 text-sm rounded border border-gray-300 bg-white"
      aria-label="Code block language"
    >
      <option value="">Plain text</option>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {lang}
        </option>
      ))}
    </select>
  );
}

/** The spike editor toolbar with formatting controls */
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const isCodeBlock = editor.isActive('codeBlock');
  const currentLanguage = isCodeBlock
    ? (editor.getAttributes('codeBlock').language as string | null)
    : null;

  return (
    <div
      className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50"
      role="toolbar"
      aria-label="Editor formatting toolbar"
    >
      {/* Heading buttons */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      {/* Separator */}
      <div className="w-px bg-gray-300 mx-1" role="separator" />

      {/* Inline formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <s>S</s>
      </ToolbarButton>

      {/* Separator */}
      <div className="w-px bg-gray-300 mx-1" role="separator" />

      {/* List buttons */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        UL
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      >
        OL
      </ToolbarButton>

      {/* Separator */}
      <div className="w-px bg-gray-300 mx-1" role="separator" />

      {/* Block formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      >
        Quote
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        Code
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        HR
      </ToolbarButton>

      {/* Language selector (visible when in code block) */}
      {isCodeBlock && (
        <>
          <div className="w-px bg-gray-300 mx-1" role="separator" />
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

/** Sample content for testing HTML tag enumeration */
const SAMPLE_CONTENT = `
<h2>Sample Blog Post</h2>
<p>This is a <strong>bold</strong> and <em>italic</em> paragraph with a <a href="https://example.com">link</a>.</p>
<h3>Code Example</h3>
<pre><code class="language-rust">fn main() {
    println!("Hello, World!");
}</code></pre>
<ul>
  <li>Bullet item one</li>
  <li>Bullet item two</li>
</ul>
<ol>
  <li>Ordered item one</li>
  <li>Ordered item two</li>
</ol>
<blockquote><p>This is a blockquote</p></blockquote>
<p>Text with <s>strikethrough</s> formatting.</p>
<hr>
<img src="https://via.placeholder.com/300x200" alt="Placeholder image" title="Test image">
`;

export default function EditorSpike() {
  const [htmlOutput, setHtmlOutput] = useState<string>('');
  const [showHtml, setShowHtml] = useState(false);

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
    ],
    content: SAMPLE_CONTENT,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none',
        'data-testid': 'tiptap-editor',
      },
    },
  });

  const handleGetHtml = useCallback(() => {
    if (editor) {
      setHtmlOutput(editor.getHTML());
      setShowHtml(true);
    }
  }, [editor]);

  const handleLoadSample = useCallback(() => {
    if (editor) {
      editor.commands.setContent(SAMPLE_CONTENT);
    }
  }, [editor]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Tiptap Editor Spike
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          BL-008.3.1 - Editor Feasibility Validation (experimental, not for production)
        </p>
      </div>

      {/* Editor container */}
      <div className="border border-gray-300 rounded-lg overflow-hidden mb-4">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={handleGetHtml}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Get HTML Output
        </button>
        <button
          type="button"
          onClick={handleLoadSample}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Load Sample Content
        </button>
      </div>

      {/* HTML output display */}
      {showHtml && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">HTML Output</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            {htmlOutput}
          </pre>
        </div>
      )}

      {/* Spike info panel */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Spike Checkpoints</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>1. Bundle size: Check Vite build output for editor chunk gzip size</li>
          <li>2. Paste handling: Copy from Google Docs/Word/Notion and paste here</li>
          <li>3. Code blocks: Click "Code" button, select language from dropdown</li>
          <li>4. HTML tags: Click "Get HTML Output" to see Tiptap output</li>
          <li>5. Mobile/tablet: Resize browser to 768px width</li>
        </ul>
      </div>
    </div>
  );
}
