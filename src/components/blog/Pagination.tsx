/**
 * Pagination Component
 *
 * Pagination controls for PostTable with Previous/Next and page numbers.
 *
 * @see BL-008.3.5 Task 13 - Pagination for post listing
 * @see AC1, AC2 - Dashboard pagination
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to display (show max 5 pages with ellipsis)
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6" data-testid="pagination">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> posts
      </div>
      <nav className="flex items-center space-x-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-3 py-1 rounded text-sm font-medium ${
            currentPage <= 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          data-testid="pagination-prev"
          aria-label="Previous page"
        >
          Previous
        </button>
        {getPageNumbers().map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-current={page === currentPage ? 'page' : undefined}
              data-testid={`pagination-page-${page}`}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1 rounded text-sm font-medium ${
            currentPage >= totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          data-testid="pagination-next"
          aria-label="Next page"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
