import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

const Pagination = ({ page, totalPages, totalItems, limit, onPageChange, onLimitChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1 && totalItems <= limit) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
      <p className="text-sm text-secondary-500 dark:text-secondary-400">
        Showing {Math.min((page - 1) * limit + 1, totalItems)} to {Math.min(page * limit, totalItems)} of {totalItems} entries
      </p>

      <div className="flex items-center gap-2">
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="text-sm border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-secondary-600 dark:text-secondary-400"
          >
            <FiChevronsLeft size={16} />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-secondary-600 dark:text-secondary-400"
          >
            <FiChevronLeft size={16} />
          </button>

          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-secondary-400">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
          <span className="sm:hidden text-sm text-secondary-500 dark:text-secondary-400 px-2">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-secondary-600 dark:text-secondary-400"
          >
            <FiChevronRight size={16} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-secondary-600 dark:text-secondary-400"
          >
            <FiChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
