/**
 * Language Selector for Code Blocks
 *
 * Dropdown component for selecting syntax highlighting language in code blocks.
 * Extracted from EditorSpike.tsx for production use.
 *
 * Languages are limited to 4 (rust, typescript, json, bash) to minimize bundle size.
 * highlight.js@11.11.1 is pinned for visual parity with marketing-suite (Story 5.2).
 *
 * @see BL-008.3.2 - Blog Editor Core
 * @see BL-008.3.1 - Tiptap Spike (original implementation)
 */

import { SUPPORTED_LANGUAGES } from '@/pages/blog/EditorSpike';

interface LanguageSelectorProps {
  currentLanguage: string | null;
  onSelect: (lang: string) => void;
}

/**
 * Language selector dropdown for code blocks.
 * Shows the 4 supported languages plus a "Plain text" option.
 */
export function LanguageSelector({ currentLanguage, onSelect }: LanguageSelectorProps) {
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
