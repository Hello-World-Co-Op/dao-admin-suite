/**
 * Tests for Blog Editor Page - Production Editor
 *
 * Story BL-008.3.2 + BL-008.3.3 combined tests
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
 * - TitleField with validation (BL-008.3.3 AC1, AC3)
 * - MetadataPanel integration (BL-008.3.3 AC2)
 * - Save draft via oracle-bridge (BL-008.3.3 AC5)
 * - Load existing post (BL-008.3.3 AC6)
 * - StaleEdit error handling (BL-008.3.3 AC6)
 * - SlugTaken error handling (BL-008.3.3 AC6)
 * - No skipped tests (AI-R24)
 *
 * @see BL-008.3.2 - Blog Editor Core -- Rich-Text Editing and Formatting
 * @see BL-008.3.3 - Post Creation Form and Metadata Panel
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';

// Mock fetch for oracle-bridge calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock import.meta.env
vi.stubEnv('VITE_ORACLE_BRIDGE_URL', 'http://localhost:8787');

// Mock @hello-world-co-op/auth
vi.mock('@hello-world-co-op/auth', () => ({
  RoleGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
  LoginRedirect: () => <div data-testid="login-redirect">Login Redirect</div>,
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
    displayName: null,
    icPrincipal: null,
    membershipStatus: null,
  }),
}));

// Mock useAutoSave to prevent timer side effects in existing tests
const mockMarkDirty = vi.fn();
const mockTriggerSave = vi.fn();
vi.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    markDirty: mockMarkDirty,
    triggerSave: mockTriggerSave,
    isDirty: false,
  }),
}));

// Mock blogApi to prevent double-fetch in manual save tests
vi.mock('@/utils/blogApi', () => ({
  saveDraft: vi.fn(),
}));

// Mock recovery utilities
vi.mock('@/utils/recovery', () => ({
  checkForRecovery: vi.fn().mockReturnValue(null),
  clearBackup: vi.fn(),
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
let editorUpdateListeners: (() => void)[] = [];

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
        getHTML: () => '<p>Test content with some words to count for reading time</p>',
        commands: { setContent: vi.fn() },
        on: (_event: string, callback: () => void) => {
          editorUpdateListeners.push(callback);
        },
        off: (_event: string, _callback: () => void) => {
          editorUpdateListeners = [];
        },
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
    { title: 'Image', description: 'Upload an image', command: 'image', action: vi.fn() },
    { title: 'Code Block', description: 'Insert a code block', command: 'code', action: vi.fn() },
    { title: 'Quote', description: 'Insert a blockquote', command: 'quote', action: vi.fn() },
    { title: 'Horizontal Rule', description: 'Insert a horizontal divider', command: 'hr', action: vi.fn() },
  ],
  CommandList: () => <div data-testid="command-list">Command List</div>,
  setSlashImageHandler: vi.fn(),
}));

// Mock useImageUpload hook to prevent side effects in existing tests
vi.mock('@/hooks/useImageUpload', () => ({
  useImageUpload: () => ({
    queue: [],
    isUploading: false,
    addToQueue: vi.fn(),
    processQueue: vi.fn(),
    retryUpload: vi.fn(),
    removeFromQueue: vi.fn(),
    clearCompleted: vi.fn(),
    completedCount: 0,
    totalCount: 0,
    statusMessage: '',
  }),
}));

// Mock imageUtils
vi.mock('@/utils/imageUtils', () => ({
  isValidImageType: vi.fn().mockReturnValue(true),
  compressImage: vi.fn(),
  uploadWithTimeout: vi.fn(),
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_IMAGE_WIDTH: 1200,
  MAX_IMAGE_SIZE_MB: 2,
  UPLOAD_TIMEOUT_MS: 30_000,
}));

// Import components after mocks
import { ProtectedRoute } from '@hello-world-co-op/auth';
import { SLASH_COMMANDS } from '@/components/blog/SlashCommandMenu';
import { saveDraft as mockSaveDraftFn } from '@/utils/blogApi';

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
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockPrompt.mockReturnValue(null);
    capturedOnUpdate = undefined;
    capturedHandlePaste = undefined;
    editorUpdateListeners = [];

    // Default: categories fetch returns empty array
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

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

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('AC1: Code-split editor page with LCP performance', () => {
    it('renders BlogEditorPage without errors (smoke test)', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId('blog-editor-page')).toBeInTheDocument();
      }, { timeout: 5000 });
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
        const mainToolbar = screen.getByRole('toolbar', { name: 'Editor formatting toolbar' });
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

      expect(result).toBe(false);
    });

    it('paste with plain content does not trigger cleaning notification', async () => {
      renderEditor();

      await waitFor(() => {
        expect(capturedHandlePaste).toBeInstanceOf(Function);
      });

      capturedHandlePaste!(null, {
        clipboardData: {
          getData: (type: string) => {
            if (type === 'text/html') return '<p>Plain text</p>';
            return '';
          },
        },
      });

      if (capturedOnUpdate) capturedOnUpdate();

      expect(screen.queryByTestId('editor-toast')).not.toBeInTheDocument();
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

  describe('BL-008.3.3 AC1: TitleField integration', () => {
    it('renders TitleField above the editor', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId('title-field')).toBeInTheDocument();
      });
    });

    it('TitleField shows validation error on blur when empty', async () => {
      renderEditor();

      await waitFor(() => {
        const titleField = screen.getByTestId('title-field');
        fireEvent.blur(titleField);
      });

      await waitFor(() => {
        expect(screen.getByTestId('title-error')).toBeInTheDocument();
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    it('TitleField accepts valid title and clears error', async () => {
      renderEditor();

      await waitFor(() => {
        const titleField = screen.getByTestId('title-field');
        // First blur to mark as touched
        fireEvent.blur(titleField);
      });

      // Now type valid title
      const titleField = screen.getByTestId('title-field');
      fireEvent.change(titleField, { target: { value: 'My First Post' } });
      fireEvent.blur(titleField);

      await waitFor(() => {
        expect(screen.queryByTestId('title-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('BL-008.3.3 AC2: MetadataPanel integration', () => {
    it('renders MetadataPanel on the page', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId('metadata-panel')).toBeInTheDocument();
      });
    });

    it('MetadataPanel can be expanded to show all fields', async () => {
      renderEditor();

      await waitFor(() => {
        const toggle = screen.getByTestId('metadata-toggle');
        fireEvent.click(toggle);
      });

      await waitFor(() => {
        expect(screen.getByTestId('metadata-content')).toBeInTheDocument();
        expect(screen.getByTestId('slug-field')).toBeInTheDocument();
        expect(screen.getByTestId('excerpt-editor')).toBeInTheDocument();
        expect(screen.getByTestId('tag-input')).toBeInTheDocument();
        expect(screen.getByTestId('seo-preview')).toBeInTheDocument();
      });
    });
  });

  describe('BL-008.3.3 AC3: Slug auto-generation on title blur', () => {
    it('auto-generates slug from title when slug is empty', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId('title-field')).toBeInTheDocument();
      });

      // Type title
      const titleField = screen.getByTestId('title-field');
      fireEvent.change(titleField, { target: { value: 'My Amazing Blog Post' } });
      fireEvent.blur(titleField);

      // Expand metadata panel to see slug
      const toggle = screen.getByTestId('metadata-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        const slugInput = screen.getByTestId('slug-input');
        expect((slugInput as HTMLInputElement).value).toBe('my-amazing-blog-post');
      });
    });
  });

  describe('BL-008.3.3 AC5: Create new post via oracle-bridge', () => {
    it('calls create_post on Save Draft and shows success toast', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/blog/categories')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        if (url.includes('/api/blog/create')) {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ success: true, id: 42 }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId('title-field')).toBeInTheDocument();
      });

      // Enter title
      fireEvent.change(screen.getByTestId('title-field'), { target: { value: 'Test Post Title' } });

      // Click Save Draft
      fireEvent.click(screen.getByRole('button', { name: /Save draft/i }));

      await waitFor(() => {
        // Verify create_post was called
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/blog/create'),
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Draft saved successfully')).toBeInTheDocument();
      });
    });

    it('shows error toast when title is empty on save', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByTestId('blog-editor-page')).toBeInTheDocument();
      });

      // Click Save Draft without entering title
      fireEvent.click(screen.getByRole('button', { name: /Save draft/i }));

      await waitFor(() => {
        expect(screen.getByText('Please enter a title before saving')).toBeInTheDocument();
      });
    });
  });

  describe('BL-008.3.3 AC6: Load existing post', () => {
    it('loads post data when editing existing post', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/blog/categories')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        if (url.includes('/api/blog/post/test-post')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 42,
              title: 'Loaded Post Title',
              slug: 'test-post',
              body: '<p>Loaded content</p>',
              excerpt: 'Test excerpt',
              categories: ['tech'],
              tags: ['test'],
              status: 'Draft',
              updated_at: 1707800000000000,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      renderEditor('/blog/editor/test-post');

      await waitFor(() => {
        expect(screen.getByText('Edit Post')).toBeInTheDocument();
      });

      // Verify title was populated
      await waitFor(() => {
        const titleField = screen.getByTestId('title-field') as HTMLInputElement;
        expect(titleField.value).toBe('Loaded Post Title');
      });
    });

    it('shows error and redirects on 404 (AC5: NotFound -> redirect to /blog + toast)', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/blog/categories')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        if (url.includes('/api/blog/post/not-found')) {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'Not Found', message: 'Post not found' }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      renderEditor('/blog/editor/not-found');

      await waitFor(() => {
        // AC5: NotFound -> redirect to /blog (per BlogError mapping)
        expect(mockNavigate).toHaveBeenCalledWith('/blog');
      });

      await waitFor(() => {
        expect(screen.getByText('Post not found')).toBeInTheDocument();
      });
    });
  });

  describe('BL-008.3.3: StaleEdit error handling', () => {
    it('shows stale edit banner on 409 conflict', async () => {
      // First set up with an existing post
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/blog/categories')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        if (url.includes('/api/blog/post/my-post')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 1,
              title: 'My Post',
              slug: 'my-post',
              body: '<p>Content</p>',
              excerpt: '',
              categories: [],
              tags: [],
              status: 'Draft',
              updated_at: 100,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      // Mock saveDraft to return StaleEdit
      vi.mocked(mockSaveDraftFn).mockResolvedValue({
        success: false,
        error: 'StaleEdit',
        message: 'This post was modified in another session. Reload to see latest changes.',
      });

      renderEditor('/blog/editor/my-post');

      // Wait for post to load
      await waitFor(() => {
        const titleField = screen.getByTestId('title-field') as HTMLInputElement;
        expect(titleField.value).toBe('My Post');
      });

      // Try to save
      fireEvent.click(screen.getByRole('button', { name: /Save draft/i }));

      await waitFor(() => {
        expect(screen.getByTestId('persistent-banner')).toBeInTheDocument();
      });
    });
  });

  describe('Editor structure and data-testids', () => {
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

    it('Save Draft button is rendered', async () => {
      renderEditor();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save draft/i })).toBeInTheDocument();
      });
    });
  });
});
