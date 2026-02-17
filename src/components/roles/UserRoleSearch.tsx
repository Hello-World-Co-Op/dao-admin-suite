/**
 * UserRoleSearch Component
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 2: Search input with 300ms debounce for filtering users
 *
 * @see AC3 - Search input with 300ms debounce filters the user list
 */

import { useState, useRef, useEffect } from 'react';

interface UserRoleSearchProps {
  onSearch: (query: string) => void;
  disabled?: boolean;
}

export function UserRoleSearch({ onSearch, disabled }: UserRoleSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onSearch(value), 300);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Search by name or email..."
        disabled={disabled}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        data-testid="role-search-input"
      />
    </div>
  );
}
