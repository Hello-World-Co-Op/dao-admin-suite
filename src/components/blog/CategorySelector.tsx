/**
 * CategorySelector Component
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 11: Create CategorySelector component
 *
 * Features:
 * - Multi-select checkboxes for categories
 * - Fetches categories from oracle-bridge on mount
 * - Validation: max 20 categories
 * - Accessibility: fieldset, legend, aria-checked
 *
 * @see AC2 - MetadataPanel components
 */

import { useState, useEffect, useCallback } from 'react';

interface CategorySelectorProps {
  selected: string[];
  onChange: (categories: string[]) => void;
  oracleBridgeUrl?: string;
}

interface Category {
  name: string;
  slug: string;
  description: string;
  post_count?: number;
}

const MAX_CATEGORIES = 20;

export function CategorySelector({ selected, onChange, oracleBridgeUrl }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const baseUrl = oracleBridgeUrl || '';
        const response = await fetch(`${baseUrl}/api/blog/categories`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.warn('[CategorySelector] Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [oracleBridgeUrl]);

  const handleToggle = useCallback(
    (categoryName: string) => {
      const isSelected = selected.includes(categoryName);
      if (isSelected) {
        onChange(selected.filter((c) => c !== categoryName));
      } else {
        if (selected.length >= MAX_CATEGORIES) return;
        onChange([...selected, categoryName]);
      }
    },
    [selected, onChange],
  );

  const isOverLimit = selected.length > MAX_CATEGORIES;

  return (
    <fieldset className="space-y-1" data-testid="category-selector">
      <legend className="block text-sm font-medium text-gray-700">
        Categories ({selected.length}/{MAX_CATEGORIES})
      </legend>
      {loading ? (
        <p className="text-sm text-gray-500">Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-gray-500">No categories available</p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {categories.map((cat) => (
            <label
              key={cat.slug}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
            >
              <input
                type="checkbox"
                checked={selected.includes(cat.name)}
                onChange={() => handleToggle(cat.name)}
                aria-checked={selected.includes(cat.name)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                data-testid={`category-checkbox-${cat.slug}`}
              />
              <span>{cat.name}</span>
            </label>
          ))}
        </div>
      )}
      {isOverLimit && (
        <p className="text-xs text-red-600" role="alert" data-testid="category-error">
          Maximum {MAX_CATEGORIES} categories allowed
        </p>
      )}
    </fieldset>
  );
}
