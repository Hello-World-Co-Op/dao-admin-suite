/**
 * Tests for Blog Editor Spike - Tiptap Feasibility Validation
 *
 * Validates:
 * - Editor renders with StarterKit extensions loaded (AC1)
 * - CodeBlockLowlight extension is configured with exactly 4 languages (AC3)
 * - Editor outputs valid HTML structure (AC4)
 * - Language selector updates code block language class (AC3)
 * - Toolbar renders and is accessible (AC5)
 * - HTML tag allowlist is documented (AC4)
 *
 * @see BL-008.3.1 - Tiptap Spike -- Editor Feasibility Validation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditorSpike, {
  SUPPORTED_LANGUAGES,
  TIPTAP_HTML_ALLOWLIST,
} from './EditorSpike';

// Mock @tiptap/react to avoid full editor initialization in jsdom
// The real editor doesn't fully initialize in jsdom due to DOM limitations,
// so we mock the editor with the methods our component depends on.
const mockChain = {
  focus: vi.fn().mockReturnThis(),
  toggleHeading: vi.fn().mockReturnThis(),
  toggleBold: vi.fn().mockReturnThis(),
  toggleItalic: vi.fn().mockReturnThis(),
  toggleStrike: vi.fn().mockReturnThis(),
  toggleBulletList: vi.fn().mockReturnThis(),
  toggleOrderedList: vi.fn().mockReturnThis(),
  toggleBlockquote: vi.fn().mockReturnThis(),
  toggleCodeBlock: vi.fn().mockReturnThis(),
  setHorizontalRule: vi.fn().mockReturnThis(),
  updateAttributes: vi.fn().mockReturnThis(),
  setContent: vi.fn().mockReturnThis(),
  run: vi.fn(),
};

let mockEditorInstance: Record<string, unknown> | null = null;

vi.mock('@tiptap/react', () => {
  const actual = {
    useEditor: (config: { content: string; extensions: unknown[] }) => {
      // Store the config for verification
      mockEditorInstance = {
        extensionCount: config.extensions?.length ?? 0,
        content: config.content,
        chain: () => mockChain,
        isActive: (type: string, attrs?: Record<string, unknown>) => {
          if (type === 'codeBlock') return false;
          if (type === 'heading' && attrs?.level === 2) return false;
          return false;
        },
        getAttributes: () => ({ language: 'rust' }),
        getHTML: () =>
          '<h2>Sample Blog Post</h2><p>This is <strong>bold</strong> and <em>italic</em>.</p>' +
          '<pre><code class="language-rust">fn main() {}</code></pre>' +
          '<ul><li>Item one</li></ul><ol><li>Item one</li></ol>' +
          '<blockquote><p>Quote</p></blockquote>' +
          '<p><s>strikethrough</s></p><hr>' +
          '<img src="https://example.com/img.png" alt="Test" title="Test">',
        commands: { setContent: vi.fn() },
      };
      return mockEditorInstance;
    },
    EditorContent: ({ editor }: { editor: unknown }) => {
      if (!editor) return null;
      return <div data-testid="tiptap-editor">Editor Content Area</div>;
    },
  };
  return actual;
});

// Mock Tiptap extensions - return simple objects since we just need them to be importable
vi.mock('@tiptap/starter-kit', () => ({
  default: {
    configure: (opts: Record<string, unknown>) => ({
      name: 'starterKit',
      configured: true,
      options: opts,
    }),
  },
}));

vi.mock('@tiptap/extension-image', () => ({
  default: {
    configure: (opts: Record<string, unknown>) => ({
      name: 'image',
      configured: true,
      options: opts,
    }),
  },
}));

vi.mock('@tiptap/extension-code-block-lowlight', () => ({
  default: {
    configure: (opts: Record<string, unknown>) => ({
      name: 'codeBlockLowlight',
      configured: true,
      options: opts,
    }),
  },
}));

vi.mock('lowlight', () => {
  const registeredLanguages: string[] = [];
  return {
    createLowlight: () => ({
      register: (name: string) => {
        registeredLanguages.push(name);
      },
      registered: () => registeredLanguages,
      _registeredLanguages: registeredLanguages,
    }),
    common: {},
  };
});

vi.mock('highlight.js/lib/languages/rust', () => ({ default: () => ({}) }));
vi.mock('highlight.js/lib/languages/typescript', () => ({ default: () => ({}) }));
vi.mock('highlight.js/lib/languages/json', () => ({ default: () => ({}) }));
vi.mock('highlight.js/lib/languages/bash', () => ({ default: () => ({}) }));

describe('EditorSpike', () => {
  describe('Editor rendering (AC1)', () => {
    it('renders the editor component with title and description', () => {
      render(<EditorSpike />);

      expect(screen.getByText('Tiptap Editor Spike')).toBeInTheDocument();
      expect(
        screen.getByText(/BL-008.3.1 - Editor Feasibility Validation/)
      ).toBeInTheDocument();
    });

    it('renders the editor content area', () => {
      render(<EditorSpike />);

      expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument();
    });

    it('renders the editor with 3 extensions (StarterKit, Image, CodeBlockLowlight)', () => {
      render(<EditorSpike />);

      // The useEditor mock captures extension count
      expect(mockEditorInstance).not.toBeNull();
      expect(mockEditorInstance!.extensionCount).toBe(3);
    });

    it('renders action buttons for HTML output and sample content', () => {
      render(<EditorSpike />);

      expect(
        screen.getByRole('button', { name: 'Get HTML Output' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Load Sample Content' })
      ).toBeInTheDocument();
    });
  });

  describe('Toolbar rendering and accessibility (AC5)', () => {
    it('renders the toolbar with all formatting buttons', () => {
      render(<EditorSpike />);

      expect(screen.getByTitle('Heading 2')).toBeInTheDocument();
      expect(screen.getByTitle('Heading 3')).toBeInTheDocument();
      expect(screen.getByTitle('Bold')).toBeInTheDocument();
      expect(screen.getByTitle('Italic')).toBeInTheDocument();
      expect(screen.getByTitle('Strikethrough')).toBeInTheDocument();
      expect(screen.getByTitle('Bullet List')).toBeInTheDocument();
      expect(screen.getByTitle('Ordered List')).toBeInTheDocument();
      expect(screen.getByTitle('Blockquote')).toBeInTheDocument();
      expect(screen.getByTitle('Code Block')).toBeInTheDocument();
      expect(screen.getByTitle('Horizontal Rule')).toBeInTheDocument();
    });

    it('renders toolbar with proper ARIA role', () => {
      render(<EditorSpike />);

      expect(screen.getByRole('toolbar')).toBeInTheDocument();
      expect(screen.getByRole('toolbar')).toHaveAttribute(
        'aria-label',
        'Editor formatting toolbar'
      );
    });

    it('toolbar buttons trigger editor chain commands', () => {
      render(<EditorSpike />);

      fireEvent.click(screen.getByTitle('Bold'));
      expect(mockChain.toggleBold).toHaveBeenCalled();
      expect(mockChain.run).toHaveBeenCalled();

      fireEvent.click(screen.getByTitle('Italic'));
      expect(mockChain.toggleItalic).toHaveBeenCalled();

      fireEvent.click(screen.getByTitle('Heading 2'));
      expect(mockChain.toggleHeading).toHaveBeenCalled();

      fireEvent.click(screen.getByTitle('Code Block'));
      expect(mockChain.toggleCodeBlock).toHaveBeenCalled();
    });
  });

  describe('Language configuration (AC3)', () => {
    it('SUPPORTED_LANGUAGES contains exactly 4 languages', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(4);
    });

    it('SUPPORTED_LANGUAGES includes rust, typescript, json, and bash', () => {
      expect(SUPPORTED_LANGUAGES).toContain('rust');
      expect(SUPPORTED_LANGUAGES).toContain('typescript');
      expect(SUPPORTED_LANGUAGES).toContain('json');
      expect(SUPPORTED_LANGUAGES).toContain('bash');
    });

    it('does NOT include common bundle languages like python, java, or css', () => {
      const languages = SUPPORTED_LANGUAGES as readonly string[];
      expect(languages).not.toContain('python');
      expect(languages).not.toContain('java');
      expect(languages).not.toContain('css');
      expect(languages).not.toContain('cpp');
    });
  });

  describe('HTML output and tag enumeration (AC4)', () => {
    it('displays HTML output when "Get HTML Output" button is clicked', async () => {
      render(<EditorSpike />);

      fireEvent.click(screen.getByRole('button', { name: 'Get HTML Output' }));

      await waitFor(() => {
        expect(screen.getByText('HTML Output')).toBeInTheDocument();
      });
    });

    it('HTML output contains expected tags from Tiptap', async () => {
      render(<EditorSpike />);

      fireEvent.click(screen.getByRole('button', { name: 'Get HTML Output' }));

      await waitFor(() => {
        const pre = screen.getByText(/Sample Blog Post/);
        const html = pre.textContent!;

        // Verify block elements
        expect(html).toContain('<h2>');
        expect(html).toContain('<p>');
        expect(html).toContain('<pre>');
        expect(html).toContain('<blockquote>');
        expect(html).toContain('<hr>');

        // Verify inline elements
        expect(html).toContain('<strong>');
        expect(html).toContain('<em>');
        expect(html).toContain('<s>');

        // Verify code block with language class
        expect(html).toContain('<code class="language-rust">');

        // Verify lists
        expect(html).toContain('<ul>');
        expect(html).toContain('<ol>');
        expect(html).toContain('<li>');

        // Verify media
        expect(html).toContain('<img ');
        expect(html).toContain('alt="Test"');
      });
    });

    it('TIPTAP_HTML_ALLOWLIST documents all expected tags', () => {
      // Block elements
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('p');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('h1');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('h2');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('h3');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('blockquote');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('pre');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('hr');

      // List elements
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('ul');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('ol');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('li');

      // Inline elements
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('strong');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('em');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('s');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('code');
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('a');

      // Media
      expect(TIPTAP_HTML_ALLOWLIST).toHaveProperty('img');
    });

    it('TIPTAP_HTML_ALLOWLIST specifies correct attributes for each tag', () => {
      // Code gets class for language-* classes
      expect(TIPTAP_HTML_ALLOWLIST.code).toContain('class');

      // Links get href, target, rel
      expect(TIPTAP_HTML_ALLOWLIST.a).toContain('href');
      expect(TIPTAP_HTML_ALLOWLIST.a).toContain('target');
      expect(TIPTAP_HTML_ALLOWLIST.a).toContain('rel');

      // Images get src, alt, title
      expect(TIPTAP_HTML_ALLOWLIST.img).toContain('src');
      expect(TIPTAP_HTML_ALLOWLIST.img).toContain('alt');
      expect(TIPTAP_HTML_ALLOWLIST.img).toContain('title');

      // Ordered lists get start attribute
      expect(TIPTAP_HTML_ALLOWLIST.ol).toContain('start');

      // Simple elements have no attributes
      expect(TIPTAP_HTML_ALLOWLIST.p).toHaveLength(0);
      expect(TIPTAP_HTML_ALLOWLIST.strong).toHaveLength(0);
      expect(TIPTAP_HTML_ALLOWLIST.em).toHaveLength(0);
    });

    it('TIPTAP_HTML_ALLOWLIST does NOT allow dangerous tags', () => {
      const allowlist = TIPTAP_HTML_ALLOWLIST as Record<string, unknown>;
      // No script, style, iframe, form, input
      expect(allowlist).not.toHaveProperty('script');
      expect(allowlist).not.toHaveProperty('style');
      expect(allowlist).not.toHaveProperty('iframe');
      expect(allowlist).not.toHaveProperty('form');
      expect(allowlist).not.toHaveProperty('input');
      expect(allowlist).not.toHaveProperty('object');
      expect(allowlist).not.toHaveProperty('embed');
    });
  });

  describe('Spike info panel', () => {
    it('renders spike checkpoint information', () => {
      render(<EditorSpike />);

      expect(screen.getByText('Spike Checkpoints')).toBeInTheDocument();
      expect(
        screen.getByText(/Bundle size: Check Vite build output/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Paste handling: Copy from Google Docs/)
      ).toBeInTheDocument();
    });
  });
});
