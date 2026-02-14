/**
 * AddAuthorModal Component
 *
 * Story BL-008.7.2: Admin Operations Dashboard
 * Task 2.3: Create AddAuthorModal with form fields
 *
 * Modal form for adding or updating author roles with:
 * - Principal input field with IC principal format validation
 * - Display name input
 * - Display role input
 * - Role dropdown (Author/Admin)
 * - Submit and Cancel buttons with loading state
 *
 * @see AC2 - Assign Author or Admin role with display name and display role
 * @see Anti-pattern 6 - Validate principal before submission
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface AddAuthorModalProps {
  visible: boolean;
  onSubmit: (data: {
    principal: string;
    role: 'Admin' | 'Author';
    displayName: string;
    displayRole: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Validate IC Principal format.
 * A valid principal is either:
 * - A text representation with groups of 5 lowercase alphanumeric chars separated by dashes
 * - "2vxsx-fae" (anonymous principal)
 * - A canister/user principal (e.g., "rrkah-fqaaa-aaaaa-aaaaq-cai")
 */
function isValidPrincipal(value: string): boolean {
  if (!value || value.length < 5) return false;
  // IC principal format: groups of lowercase alnum separated by dashes, ending optionally with -cai
  return /^[a-z0-9]{1,5}(-[a-z0-9]{1,5})*(-cai)?$/.test(value);
}

export default function AddAuthorModal({ visible, onSubmit, onCancel, isSubmitting }: AddAuthorModalProps) {
  const [principal, setPrincipal] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [displayRole, setDisplayRole] = useState('');
  const [role, setRole] = useState<'Author' | 'Admin'>('Author');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const principalRef = useRef<HTMLInputElement>(null);

  // Focus principal field when modal opens
  useEffect(() => {
    if (visible && principalRef.current) {
      principalRef.current.focus();
    }
  }, [visible]);

  // Reset form on close
  useEffect(() => {
    if (!visible) {
      setPrincipal('');
      setDisplayName('');
      setDisplayRole('');
      setRole('Author');
      setErrors({});
    }
  }, [visible]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!principal.trim()) {
      newErrors.principal = 'Principal is required';
    } else if (!isValidPrincipal(principal.trim())) {
      newErrors.principal = 'Invalid IC principal format';
    }

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.trim().length > 100) {
      newErrors.displayName = 'Display name must be 100 characters or fewer';
    }

    if (!displayRole.trim()) {
      newErrors.displayRole = 'Display role is required';
    } else if (displayRole.trim().length > 100) {
      newErrors.displayRole = 'Display role must be 100 characters or fewer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [principal, displayName, displayRole]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      principal: principal.trim(),
      role,
      displayName: displayName.trim(),
      displayRole: displayRole.trim(),
    });
  }, [principal, role, displayName, displayRole, validate, onSubmit]);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [visible, onCancel]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="add-author-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-author-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 id="add-author-title" className="text-lg font-semibold text-gray-900 mb-4">
          Add Author
        </h2>

        <form onSubmit={handleSubmit} data-testid="add-author-form">
          {/* Principal */}
          <div className="mb-4">
            <label htmlFor="author-principal" className="block text-sm font-medium text-gray-700 mb-1">
              Principal
            </label>
            <input
              ref={principalRef}
              id="author-principal"
              type="text"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="rrkah-fqaaa-aaaaa-aaaaq-cai"
              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono ${
                errors.principal ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2`}
              data-testid="principal-input"
            />
            {errors.principal && (
              <p className="text-red-600 text-xs mt-1" data-testid="principal-error">
                {errors.principal}
              </p>
            )}
          </div>

          {/* Display Name */}
          <div className="mb-4">
            <label htmlFor="author-display-name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              id="author-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane Doe"
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                errors.displayName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2`}
              data-testid="display-name-input"
            />
            {errors.displayName && (
              <p className="text-red-600 text-xs mt-1" data-testid="display-name-error">
                {errors.displayName}
              </p>
            )}
          </div>

          {/* Display Role */}
          <div className="mb-4">
            <label htmlFor="author-display-role" className="block text-sm font-medium text-gray-700 mb-1">
              Display Role
            </label>
            <input
              id="author-display-role"
              type="text"
              value={displayRole}
              onChange={(e) => setDisplayRole(e.target.value)}
              placeholder="Technical Writer"
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                errors.displayRole ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2`}
              data-testid="display-role-input"
            />
            {errors.displayRole && (
              <p className="text-red-600 text-xs mt-1" data-testid="display-role-error">
                {errors.displayRole}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label htmlFor="author-role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="author-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'Author' | 'Admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="role-select"
            >
              <option value="Author">Author</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              data-testid="add-author-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                isSubmitting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              data-testid="add-author-submit"
            >
              {isSubmitting ? 'Adding...' : 'Add Author'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
