/**
 * Slash Command Menu for Block Insertion
 *
 * Implements slash commands triggered by typing "/" on an empty line.
 * Shows a dropdown menu with block insertion options that filter as the user types.
 *
 * V1 supports 4 commands:
 * - /image - Insert image placeholder
 * - /code - Insert code block
 * - /quote - Insert blockquote
 * - /hr - Insert horizontal rule
 *
 * Built using @tiptap/suggestion for the suggestion/autocomplete pattern.
 * Uses DOM-based positioning (no tippy.js dependency) to keep bundle lean.
 *
 * @see BL-008.3.2 AC4 - Slash commands for block insertion
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { Editor, Range } from '@tiptap/react';
import { Extension } from '@tiptap/react';
import { Suggestion } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import type { SuggestionOptions, SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';

/** A slash command definition */
export interface SlashCommandItem {
  title: string;
  description: string;
  command: string;
  action: (editor: Editor, range: Range) => void;
}

/**
 * External handler for image upload via slash command.
 * Set this before creating the editor to wire up the image upload flow.
 */
let _externalImageHandler: ((editor: Editor, range: Range) => void) | null = null;

/**
 * Set the external image upload handler for the /image slash command.
 * Called from BlogEditorPage to inject the alt text modal + upload flow.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function setSlashImageHandler(handler: ((editor: Editor, range: Range) => void) | null): void {
  _externalImageHandler = handler;
}

/** Slash commands available in V1 */
// eslint-disable-next-line react-refresh/only-export-components
export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Image',
    description: 'Upload an image',
    command: 'image',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).run();
      if (_externalImageHandler) {
        _externalImageHandler(editor, range);
      } else {
        const url = window.prompt('Enter image URL:');
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    },
  },
  {
    title: 'Code Block',
    description: 'Insert a code block with syntax highlighting',
    command: 'code',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Quote',
    description: 'Insert a blockquote',
    command: 'quote',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Horizontal Rule',
    description: 'Insert a horizontal divider',
    command: 'hr',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

/** Ref handle for the command list component */
export interface CommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

/** Props for the command list component */
interface CommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

/**
 * Dropdown list of available slash commands.
 * Supports keyboard navigation (arrow keys + Enter) and mouse click.
 */
export const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) {
          command(item);
        }
      },
      [items, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
          No matching commands
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[200px]"
        role="listbox"
        aria-label="Slash commands"
        data-testid="slash-command-menu"
      >
        {items.map((item, index) => (
          <button
            key={item.command}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            className={`w-full text-left px-3 py-2 text-sm cursor-pointer focus:outline-none ${
              index === selectedIndex
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => selectItem(index)}
          >
            <div className="font-medium">/{item.command}</div>
            <div className="text-xs text-gray-500">{item.description}</div>
          </button>
        ))}
      </div>
    );
  }
);

CommandList.displayName = 'CommandList';

/**
 * Create the slash command suggestion options for Tiptap.
 * Uses a lightweight DOM-based popup instead of tippy.js to minimize bundle size.
 */
function createSlashCommandSuggestion(): Omit<SuggestionOptions<SlashCommandItem>, 'editor'> {
  return {
    items: ({ query }: { query: string }) => {
      return SLASH_COMMANDS.filter((item) =>
        item.command.toLowerCase().startsWith(query.toLowerCase())
      );
    },
    render: () => {
      let component: ReactRenderer<CommandListRef> | null = null;
      let popup: HTMLDivElement | null = null;

      return {
        onStart: (props: SuggestionProps<SlashCommandItem>) => {
          component = new ReactRenderer(CommandList, {
            props: {
              items: props.items,
              command: props.command,
            },
            editor: props.editor,
          });

          popup = document.createElement('div');
          popup.style.position = 'absolute';
          popup.style.zIndex = '50';
          popup.appendChild(component.element);
          document.body.appendChild(popup);

          if (props.clientRect) {
            const rect = props.clientRect();
            if (rect) {
              popup.style.left = `${rect.left}px`;
              popup.style.top = `${rect.bottom + 4}px`;
            }
          }
        },
        onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
          component?.updateProps({
            items: props.items,
            command: props.command,
          });

          if (popup && props.clientRect) {
            const rect = props.clientRect();
            if (rect) {
              popup.style.left = `${rect.left}px`;
              popup.style.top = `${rect.bottom + 4}px`;
            }
          }
        },
        onKeyDown: (props: SuggestionKeyDownProps) => {
          if (props.event.key === 'Escape') {
            popup?.remove();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          popup?.remove();
          component?.destroy();
        },
      };
    },
    char: '/',
    command: ({ editor, range, props: item }: { editor: Editor; range: Range; props: SlashCommandItem }) => {
      item.action(editor, range);
    },
  };
}

/**
 * Tiptap extension that enables slash commands.
 * Registers the "/" trigger character and manages the suggestion popup.
 */
export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: createSlashCommandSuggestion(),
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
