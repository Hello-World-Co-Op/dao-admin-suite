/**
 * PostStatusBadge Component
 *
 * Displays a color-coded badge for blog post status.
 * Colors: Draft=gray, Published=green, Scheduled=blue, Archived=red
 *
 * @see BL-008.3.5 Task 7 - PostStatusBadge component
 * @see AC2 - PostTable with PostStatusBadge
 */

export type PostStatus = 'Draft' | 'Published' | 'Scheduled' | 'Archived';

interface PostStatusBadgeProps {
  status: PostStatus;
}

const statusConfig: Record<PostStatus, { bg: string; text: string; label: string }> = {
  Draft: {
    bg: 'bg-gray-100 text-gray-700',
    text: 'Draft',
    label: 'Post is in draft status',
  },
  Published: {
    bg: 'bg-green-100 text-green-700',
    text: 'Published',
    label: 'Post is published',
  },
  Scheduled: {
    bg: 'bg-blue-100 text-blue-700',
    text: 'Scheduled',
    label: 'Post is scheduled for publication',
  },
  Archived: {
    bg: 'bg-red-100 text-red-700',
    text: 'Archived',
    label: 'Post is archived',
  },
};

export function PostStatusBadge({ status }: PostStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.Draft;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}
      role="status"
      aria-label={config.label}
      data-testid="post-status-badge"
    >
      {status === 'Scheduled' && (
        <svg
          className="w-3 h-3 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      {config.text}
    </span>
  );
}
