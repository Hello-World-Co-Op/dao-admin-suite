import { clsx, type ClassValue } from 'clsx';

/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx for conditional classes
 *
 * Bridge pattern: Local utility wrapping clsx.
 * If @hello-world-co-op/ui exports a cn utility in the future,
 * this can be replaced with that import.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
