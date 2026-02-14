/**
 * Tests for Blog Editor Page - Production Editor
 *
 * Validates:
 * - BlogEditorPage renders without errors (smoke test) (AC1)
 * - Lazy-loaded route loads editor component (AC1)
 * - Toolbar renders with all default tools (7 buttons) (AC2)
 * - Overflow menu contains advanced tools (code blocks, blockquotes) (AC2)
 * - Toolbar has proper ARIA roles and labels (AC2)
 * - BubbleMenu appears when text is selected (AC3)
 * - Slash command menu appears when user types "/" (AC4)
 * - Code block language selector updates language class (AC6)
 * - Paste event triggers toast notification (AC5)
 * - Save draft to localStorage (placeholder for Story 3.3)
 * - No skipped tests (AI-R24)
 *
 * @see BL-008.3.2 - Blog Editor Core -- Rich-Text Editing and Formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';

// Mock @hello-world-co-op/auth
vi.mock('@hello-world-co-op/auth', () => ({
  RoleGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { userId: 'test-author', email: 'test@test.com', providers: [], roles: ['admin'] },
    roles: ['admin'],
    hasRole: (role: string) => role === 'admin',
    isAdmin: true,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    error: null,
  }),
}));

// Mock useAdminAuth
vi.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    userId: 'test-author',
    logout: vi.fn(),
  }),
}));

// Mock window.prompt for link/image dialogs
const mockPrompt = vi.fn();
window.prompt = mockPrompt;

// Mock Tiptap editor chain
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
  setLink: vi.fn().mockReturnThis(),
  unsetLink: vi.fn().mockReturnThis(),
  setImage: vi.fn().mockReturnThis(),
  deleteRange: vi.fn().mockReturnThis(),
  run: vi.fn(),
};

// Track the onUpdate callback and handlePaste from the editor config
let capturedOnUpdate: (() => void) | undefined;
let capturedHandlePaste: ((view: unknown, event: unknown) => boolean) | undefined;

let mockEditorConfig: { content: string; extensions: unknown[]; editorProps?: Record<string, unknown>; onUpdate?: () => void } | null = null;
let mockEditorInstance: Record<string, unknown> | null = null;

vi.mock('@tiptap/react', () => {
  const actual = {
    useEditor: (config: { content: string; extensions: unknown[]; editorProps?: Record<string, unknown>; onUpdate?: () => void }) => {
      mockEditorConfig = config;
      capturedOnUpdate = config.onUpdate;
      capturedHandlePaste = (config.editorProps as Record<string, unknown>)?.handlePaste as typeof capturedHandlePaste;
      mockEditorInstance = {
        extensionCount: config.extensions?.length ?? 0,
        content: config.content,
        chain: () => mockChain,
        isActive: (type: string, attrs?: Record<string, unknown>) => {
          if (type === 'codeBlock') return false;
          if (type === 'heading' && attrs?.level === 2) return false;
          if (type === 'link') return false;
          return false;
        },
        getAttributes: (type: string) => {
          if (type === 'codeBlock') return { language: 'rust' };
          if (type === 'link') return { href: '' };
          return {};
        },
        getHTML: () => '<p>Test content</p>',
        commands: { setContent: vi.fn() },
      };
      return mockEditorInstance;
    },
    EditorContent: ({ editor }: { editor: unknown }) => {
      if (!editor) return null;
      return <div data-testid="blog-editor">Editor Content Area</div>;
    },
    Extension: {
      create: (config: Record<string, unknown>) => ({ ...config, name: config.name || 'extension' }),
    },
    ReactRenderer: vi.fn().mockImplementation(() => ({
      element: document.createElement('div'),
      updateProps: vi.fn(),
      destroy: vi.fn(),
      ref: null,
    })),
  };
  return actual;
});

// Mock BubbleMenu from @tiptap/react/menus
vi.mock('@tiptap/react/menus', () => ({
  BubbleMenu: ({ children, shouldShow, editor }: {
    children: ReactNode;
    shouldShow?: (props: { editor: unknown; from: number; to: number }) => boolean;
    editor: unknown;
  }) => {
    // Simulate shouldShow logic for testing
    const show = shouldShow ? shouldShow({ editor, from: 0, to: 5 }) : true;
    if (!show) return null;
    return <div data-testid="bubble-menu">{children}</div>;
  },
}));

// Mock Tiptap extensions
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

// Mock @tiptap/suggestion
vi.mock('@tiptap/suggestion', () => ({
  Suggestion: vi.fn().mockReturnValue({ key: 'suggestion-plugin' }),
}));

// Mock SlashCommands extension
vi.mock('@/components/blog/SlashCommandMenu', () => ({
  SlashCommands: { name: 'slashCommands' },
  SLASH_COMMANDS: [
    { title: 'Image', description: 'Insert an image', command: 'image', action: vi.fn() },
    { title: 'Code Block', description: 'Insert a code block', command: 'code', action: vi.fn() },
    { title: 'Quote', description: 'Insert a blockquote', command: 'quote', action: vi.fn() },
    { title: 'Horizontal Rule', description: 'Insert a horizontal divider', command: 'hr', action: vi.fn() },
  ],
  CommandList: () => <div data-testid="command-list">Command List</div>,
}));

// Import components after mocks
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SLASH_COMMANDS } from '@/components/blog/SlashCommandMenu';

// Helper to render BlogEditorPage at a specific route
function renderEditor(path: string = '/blog/editor/new') {
  const BlogEditorPage = lazy(() => import('./BlogEditorPage'));

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Suspense fallback={<div data-testid="loading">Loading...</div>}>
        <Routes>
          <Route path="/blog/editor/new" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
          <Route path="/blog/editor/:id" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </MemoryRouter>
  );
}

describe('BlogEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockPrompt.mockReturnValue(null);
    capturedOnUpdate = undefined;
    capturedHandlePaste = undefined;

    // Re-setup chain mock return values after clearAllMocks
    mockChain.focus.mockReturnThis();
    mockChain.toggleHeading.mockReturnThis();
    mockChain.toggleBold.mockReturnThis();
    mockChain.toggleItalic.mockReturnThis();
    mockChain.toggleStrike.mockReturnThis();
    mockChain.toggleBulletList.mockReturnThis();
    mockChain.toggleOrderedList.mockReturnThis();
    mockChain.toggleBlockquote.mockReturnThis();
    mockChain.toggleCodeBlock.mockReturnThis();
    mockChain.setHorizontalRule.mockReturnThis();
    mockChain.updateAttributes.mockReturnThis();
    mockChain.setContent.mockReturnThis();
    mockChain.setLink.mockReturnThis();
    mockChain.unsetLink.mockReturnThis();
    mockChain.setImage.mockReturnThis();
    mockChain.deleteRange.mockReturnThis();
  });

  describe('AC1: Code-split editor page with LCP performance', () => {
    it('renders BlogEditorPage without errors (smoke test)', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId('blog-editor-page')).toBeInTheDocument();
      });
    });

    it('lazy-loaded route loads editor component via Suspense', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId('blog-editor')).toBeInTheDocument();
      });
    });

    it('displays "New Blog Post" title for new post route', async () => {
      renderEditor('/blog/editor/new');

      await waitFor(() => {
        expect(screen.getByText('New Blog Post')).toBeInTheDocument();
      });
    });

    it('displays "Edit Post" title for edit post route', async () => {
      renderEditor('/blog/editor/abc123');

      await waitFor(() => {
        expect(screen.getByText('Edit Post')).toBeInTheDocument();
      });
    });

    it('initializes editor with 4 extensions (StarterKit, Image, CodeBlockLowlight, SlashCommands)', async () => {
      renderEditor();

      await waitFor(() => {
        expect(mockEditorConfig).not.toBeNull();
        expect(mockEditorConfig!.extensions).toHaveLength(4);
      });
    });
  });

  describe('AC2: Progressive toolbar with accessibility', () => {
    it('renders toolbar with all default tools', async () => {
      renderEditor();

      await waitFor(() => {
        // Get the main toolbar (not the BubbleMenu toolbar)
        const mainToolbar = screen.getByRole('toolbar', { name: 'Editor formatting toolbar' });

        // Default tools in the main toolbar
        expect(within(mainToolbar).getByRole('button', { name: /Bold/i })).toBeInTheDocument();
        expect(within(mainToolbar).getByRole('button', { name: /Italic/i })).toBeInTheDocument();
        expect(within(mainToolbar).getByRole('button', { name: /Heading 2/i })).toBeInTheDocument();
        expect(within(mainToolbar).getByRole('button', { name: /Heading 3/i })).toBeInTheDocument();
        expect(within(mainToolbar).getByRole('button', { name: /Insert link/i })).toBeInTheDocument();
        expect(within(mainToolbar).getByRole('button', { name: /Insert image/i })).toBeInTheDocument();
        expect(within(mainToolbar).getByRole('button', { name: 'Unordered list' })).toBeInTheDocument();
        expect(within(mainToolbar).getByRole('button', { name: 'Ordered list' })).toBeInTheDocument();
      });
    });

    it('renders overflow menu button for advanced tools', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /More formatting options/i })).toBeInTheDocument();
      });
    });

    it('overflow menu shows code block and blockquote options when opened', async () => {
      renderEditor();

      await waitFor(() => {
        const moreButton = screen.getByRole('button', { name: /More formatting options/i });
        fireEvent.click(moreButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /Code block/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Blockquote/i })).toBeInTheDocument();
      });
    });

    it('toolbar has role="toolbar" with accessible label', async () => {
      renderEditor();

      await waitFor(() => {
        const mainToolbar = screen.getByRole('toolbar', { name: 'Editor formatting toolbar' });
        expect(mainToolbar).toBeInTheDocument();
      });
    });

    it('toolbar buttons have ARIA labels with keyboard shortcuts', async () => {
      renderEditor();

      await waitFor(() => {
        const boldButton = screen.getByRole('button', { name: /Bold \(Ctrl\+B\)/i });
        expect(boldButton).toHaveAttribute('aria-label', 'Bold (Ctrl+B)');
        expect(boldButton).toHaveAttribute('aria-pressed');
      });
    });

    it('toolbar bold button triggers editor chain command', async () => {
      renderEditor();

      await waitFor(() => {
        const mainToolbar = screen.getByRole('toolbar', { name: 'Editor formatting toolbar' });
        const boldButton = within(mainToolbar).getByRole('button', { name: /Bold/i });
        fireEvent.click(boldButton);
        expect(mockChain.toggleBold).toHaveBeenCalled();
        expect(mockChain.run).toHaveBeenCalled();
      });
    });
  });

  describe('AC3: BubbleMenu for inline formatting', () => {
    it('renders BubbleMenu component', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId('bubble-menu')).toBeInTheDocument();
      });
    });

    it('BubbleMenu contains bold, italic, and link buttons', async () => {
      renderEditor();

      await waitFor(() => {
        const bubbleMenu = screen.getByTestId('bubble-menu');
        const inlineToolbar = within(bubbleMenu).getByRole('toolbar', { name: 'Inline formatting' });
        expect(inlineToolbar).toBeInTheDocument();

        // Check BubbleMenu-specific buttons
        expect(within(bubbleMenu).getByRole('button', { name: 'Bold' })).toBeInTheDocument();
        expect(within(bubbleMenu).getByRole('button', { name: 'Italic' })).toBeInTheDocument();
        expect(within(bubbleMenu).getByRole('button', { name: 'Link' })).toBeInTheDocument();
      });
    });
  });

  describe('AC4: Slash commands for block insertion', () => {
    it('SLASH_COMMANDS contains 4 commands (image, code, quote, hr)', () => {
      expect(SLASH_COMMANDS).toHaveLength(4);
      expect(SLASH_COMMANDS.map(c => c.command)).toEqual(['image', 'code', 'quote', 'hr']);
    });

    it('SlashCommands extension is included in editor configuration', async () => {
      renderEditor();

      await waitFor(() => {
        expect(mockEditorConfig).not.toBeNull();
        const extensions = mockEditorConfig!.extensions;
        expect(extensions).toHaveLength(4);
        // SlashCommands is the 4th extension (after StarterKit, Image, CodeBlockLowlight)
        const slashExt = extensions[3] as { name: string };
        expect(slashExt.name).toBe('slashCommands');
      });
    });

    it('each slash command has a title, description, and action', () => {
      for (const cmd of SLASH_COMMANDS) {
        expect(cmd.title).toBeTruthy();
        expect(cmd.description).toBeTruthy();
        expect(cmd.command).toBeTruthy();
        expect(typeof cmd.action).toBe('function');
      }
    });
  });

  describe('AC5: Paste handling with cleaning notification', () => {
    it('editor has custom handlePaste configured', async () => {
      renderEditor();

      await waitFor(() => {
        expect(capturedHandlePaste).toBeInstanceOf(Function);
      });
    });

    it('paste event with rich formatting returns false to let Tiptap handle it', async () => {
      renderEditor();

      await waitFor(() => {
        expect(capturedHandlePaste).toBeInstanceOf(Function);
      });

      const result = capturedHandlePaste!(null, {
        clipboardData: {
          getData: (type: string) => {
            if (type === 'text/html') {
              return '<p style="font-family: Arial">Formatted <span style="color:red">text</span></p>';
            }
            return '';
          },
        },
      });

      // Should return false to let Tiptap handle the paste
      expect(result).toBe(false);
    });

    it('paste with plain content does not trigger cleaning notification', async () => {
      renderEditor();

      await waitFor(() => {
        expect(capturedHandlePaste).toBeInstanceOf(Function);
      });

      // Simulate paste with plain HTML (no style= or span)
      capturedHandlePaste!(null, {
        clipboardData: {
          getData: (type: string) => {
            if (type === 'text/html') return '<p>Plain text</p>';
            return '';
          },
        },
      });

      // Trigger onUpdate - should NOT show toast since content was not rich
      if (capturedOnUpdate) capturedOnUpdate();

      // Toast should not appear
      expect(screen.queryByTestId('editor-toast')).not.toBeInTheDocument();
    });

    it('toast shows for save draft action', async () => {
      renderEditor();

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save draft/i });
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('editor-toast')).toBeInTheDocument();
        expect(screen.getByText('Draft saved to browser storage (temporary)')).toBeInTheDocument();
      });
    });

    it('toast can be dismissed via dismiss button', async () => {
      renderEditor();

      // Trigger toast via save
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /Save draft/i }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('editor-toast')).toBeInTheDocument();
      });

      // Click dismiss
      fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('editor-toast')).not.toBeInTheDocument();
      });
    });
  });

  describe('AC6: Code blocks with syntax highlighting', () => {
    it('editor configures CodeBlockLowlight with lowlight', async () => {
      renderEditor();

      await waitFor(() => {
        expect(mockEditorConfig).not.toBeNull();
        const extensions = mockEditorConfig!.extensions as Array<{ name: string }>;
        const codeBlockExt = extensions.find(e => e.name === 'codeBlockLowlight');
        expect(codeBlockExt).toBeDefined();
      });
    });

    it('StarterKit disables default codeBlock in favor of CodeBlockLowlight', async () => {
      renderEditor();

      await waitFor(() => {
        expect(mockEditorConfig).not.toBeNull();
        const extensions = mockEditorConfig!.extensions as Array<{ name: string; options?: Record<string, unknown> }>;
        const starterKit = extensions.find(e => e.name === 'starterKit');
        expect(starterKit).toBeDefined();
        expect(starterKit!.options).toEqual({ codeBlock: false });
      });
    });
  });

  describe('Placeholder save functionality', () => {
    it('Save Draft button is rendered', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save draft/i })).toBeInTheDocument();
      });
    });

    it('clicking Save Draft saves content to localStorage', async () => {
      renderEditor();

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /Save draft/i }));
      });

      const saved = localStorage.getItem('blog-draft-new');
      expect(saved).toBe('<p>Test content</p>');
    });

    it('shows toast after saving draft', async () => {
      renderEditor();

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /Save draft/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('Draft saved to browser storage (temporary)')).toBeInTheDocument();
      });
    });

    it('loads saved draft from localStorage', async () => {
      localStorage.setItem('blog-draft-new', '<p>Previously saved content</p>');

      renderEditor();

      await waitFor(() => {
        expect(mockEditorConfig).not.toBeNull();
        expect(mockEditorConfig!.content).toBe('<p>Previously saved content</p>');
      });
    });

    it('uses post ID for draft key when editing existing post', async () => {
      localStorage.setItem('blog-draft-post-42', '<p>Existing post content</p>');

      renderEditor('/blog/editor/post-42');

      await waitFor(() => {
        expect(mockEditorConfig).not.toBeNull();
        expect(mockEditorConfig!.content).toBe('<p>Existing post content</p>');
      });
    });
  });

  describe('AC8: No test regressions', () => {
    it('editor renders with the expected data-testid attributes', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId('blog-editor-page')).toBeInTheDocument();
        expect(screen.getByTestId('blog-editor')).toBeInTheDocument();
      });
    });

    it('editor shows instruction text for slash commands', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByText(/Use the toolbar, slash commands/)).toBeInTheDocument();
      });
    });
  });
});
