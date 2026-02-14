/**
 * TagInput Component
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 12: Create TagInput component
 *
 * Features:
 * - Pill-style tag input
 * - Add tag on Enter key or comma separator
 * - Removable pills with X button
 * - Validation: max 50 tags
 * - Accessibility: aria-label for remove buttons, role="list"
 *
 * @see AC2 - MetadataPanel components
 */

import { useState, useCallback } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const MAX_TAGS = 50;

export function TagInput({ tags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim().toLowerCase();
      if (!trimmed) return;
      if (tags.includes(trimmed)) return;
      if (tags.length >= MAX_TAGS) return;
      onChange([...tags, trimmed]);
    },
    [tags, onChange],
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(tags.filter((t) => t !== tagToRemove));
    },
    [tags, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(inputValue);
        setInputValue('');
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      }
    },
    [inputValue, addTag, removeTag, tags],
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // If user types a comma, add the tag before the comma
    if (val.includes(',')) {
      const parts = val.split(',');
      parts.forEach((part) => addTag(part));
      setInputValue('');
    } else {
      setInputValue(val);
    }
  }, [addTag]);

  const isOverLimit = tags.length > MAX_TAGS;

  return (
    <div className="space-y-1" data-testid="tag-input">
      <label htmlFor="tag-input-field" className="block text-sm font-medium text-gray-700">
        Tags ({tags.length}/{MAX_TAGS})
      </label>
      <div className="flex flex-wrap gap-1 p-2 border border-gray-300 rounded-md min-h-[38px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <ul role="list" className="flex flex-wrap gap-1" aria-label="Tags" data-testid="tag-list">
          {tags.map((tag) => (
            <li
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
              data-testid={`tag-pill-${tag}`}
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-600 hover:text-blue-900 focus:outline-none"
                aria-label={`Remove tag ${tag}`}
                data-testid={`tag-remove-${tag}`}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
        <input
          id="tag-input-field"
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
          className="flex-1 min-w-[100px] text-sm border-0 focus:outline-none focus:ring-0 p-0"
          data-testid="tag-text-input"
        />
      </div>
      {isOverLimit && (
        <p className="text-xs text-red-600" role="alert" data-testid="tag-error">
          Maximum {MAX_TAGS} tags allowed
        </p>
      )}
      <p className="text-xs text-gray-500">Press Enter or comma to add a tag</p>
    </div>
  );
}
