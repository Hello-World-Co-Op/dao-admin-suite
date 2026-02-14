/**
 * StatusFilterTabs Component
 *
 * Tab bar for filtering posts by status.
 * Tabs: All, Drafts, Published, Scheduled, Archived, Ready for Review
 *
 * @see BL-008.3.5 Task 6 - Status filter tabs
 * @see AC2 - Status filter tabs
 * @see AC7 - Ready for Review tab
 */

import type { BlogPost } from './PostTable';

export type FilterTab = 'all' | 'Draft' | 'Published' | 'Scheduled' | 'Archived' | 'ready_for_review';

interface StatusFilterTabsProps {
  posts: BlogPost[];
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
}

const tabConfig: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All Posts' },
  { key: 'Draft', label: 'Drafts' },
  { key: 'Published', label: 'Published' },
  { key: 'Scheduled', label: 'Scheduled' },
  { key: 'Archived', label: 'Archived' },
  { key: 'ready_for_review', label: 'Ready for Review' },
];

function getTabCount(posts: BlogPost[], tab: FilterTab): number {
  if (tab === 'all') return posts.length;
  if (tab === 'ready_for_review') return posts.filter((p) => p.tags.includes('ready_for_review')).length;
  return posts.filter((p) => p.status === tab).length;
}

export function filterPostsByTab(posts: BlogPost[], tab: FilterTab): BlogPost[] {
  if (tab === 'all') return posts;
  if (tab === 'ready_for_review') return posts.filter((p) => p.tags.includes('ready_for_review'));
  return posts.filter((p) => p.status === tab);
}

export function StatusFilterTabs({ posts, activeTab, onTabChange }: StatusFilterTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-4" data-testid="status-filter-tabs">
      <nav className="flex -mb-px space-x-4 overflow-x-auto" aria-label="Post status filters">
        {tabConfig.map(({ key, label }) => {
          const count = getTabCount(posts, key);
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`filter-tab-${key}`}
            >
              {label} ({count})
            </button>
          );
        })}
      </nav>
    </div>
  );
}
