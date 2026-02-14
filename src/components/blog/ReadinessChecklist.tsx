/**
 * ReadinessChecklist Component
 *
 * Story BL-008.7.2: Admin Operations Dashboard
 * Task 3: Create pre-launch readiness checklist
 *
 * Displays progress toward blog launch readiness:
 * - Published post count vs target (6 posts)
 * - Category coverage count vs target (3+ categories with content)
 * - Categories flagged as "Needs content" (< 1 post)
 * - Overall readiness percentage as a progress ring
 *
 * @see AC3 - Pre-launch readiness checklist showing progress
 * @see FR52 - Operational health indicators
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchReadinessData, type ReadinessData } from '@/utils/blogApi';

const TARGET_POSTS = 6;
const TARGET_CATEGORIES = 3;

/**
 * Calculate overall readiness percentage (0-100).
 * Equal weighting: 50% post progress + 50% category progress.
 */
function calculateReadiness(publishedPosts: number, categoriesWithContent: number): number {
  const postProgress = Math.min(publishedPosts / TARGET_POSTS, 1.0);
  const categoryProgress = Math.min(categoriesWithContent / TARGET_CATEGORIES, 1.0);
  return Math.round((postProgress + categoryProgress) / 2 * 100);
}

/**
 * SVG Progress Ring component.
 */
function ProgressRing({ percentage }: { percentage: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let color = 'text-red-500';
  if (percentage >= 100) color = 'text-green-500';
  else if (percentage >= 50) color = 'text-amber-500';

  return (
    <div className="relative inline-flex items-center justify-center" data-testid="progress-ring">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
        />
      </svg>
      <span className="absolute text-lg font-bold text-gray-900" data-testid="readiness-percentage">
        {percentage}%
      </span>
    </div>
  );
}

export default function ReadinessChecklist() {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchReadinessData();
      setData(result);
      setError(null);
    } catch {
      setError('Failed to load readiness data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categoriesWithContent = useMemo(() => {
    if (!data) return 0;
    return data.categories.filter((c) => c.post_count > 0).length;
  }, [data]);

  const readinessPercentage = useMemo(() => {
    if (!data) return 0;
    return calculateReadiness(data.publishedPostCount, categoriesWithContent);
  }, [data, categoriesWithContent]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="readiness-checklist">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="readiness-checklist">
        <p className="text-red-600 text-sm" data-testid="readiness-error">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="readiness-checklist">
        <p className="text-gray-500 text-sm" data-testid="readiness-empty">No readiness data available.</p>
      </div>
    );
  }

  const postsMet = data.publishedPostCount >= TARGET_POSTS;
  const categoriesMet = categoriesWithContent >= TARGET_CATEGORIES;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="readiness-checklist">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pre-Launch Readiness</h3>

      <div className="flex items-start gap-8">
        {/* Progress Ring */}
        <div className="flex-shrink-0">
          <ProgressRing percentage={readinessPercentage} />
        </div>

        {/* Checklist Items */}
        <div className="flex-1 space-y-4">
          {/* Published Posts Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Published Posts</span>
              <span
                className={`text-sm font-semibold ${postsMet ? 'text-green-600' : 'text-gray-900'}`}
                data-testid="posts-progress"
              >
                {data.publishedPostCount}/{TARGET_POSTS}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${postsMet ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((data.publishedPostCount / TARGET_POSTS) * 100, 100)}%` }}
                data-testid="posts-progress-bar"
              />
            </div>
          </div>

          {/* Category Coverage Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Category Coverage</span>
              <span
                className={`text-sm font-semibold ${categoriesMet ? 'text-green-600' : 'text-gray-900'}`}
                data-testid="categories-progress"
              >
                {categoriesWithContent}/{TARGET_CATEGORIES}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${categoriesMet ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((categoriesWithContent / TARGET_CATEGORIES) * 100, 100)}%` }}
                data-testid="categories-progress-bar"
              />
            </div>
          </div>

          {/* Category Details */}
          {data.categories.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Categories</p>
              <div className="flex flex-wrap gap-2" data-testid="category-list">
                {data.categories.map((cat) => (
                  <span
                    key={cat.slug}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cat.post_count > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                    data-testid={`category-badge-${cat.slug}`}
                  >
                    {cat.name} ({cat.post_count})
                    {cat.post_count === 0 && (
                      <span className="ml-1" data-testid={`needs-content-${cat.slug}`}>
                        - Needs content
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.categories.length === 0 && (
            <p className="text-sm text-gray-500" data-testid="no-categories">
              No categories defined yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
