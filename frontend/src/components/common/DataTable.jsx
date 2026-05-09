import { useState, useMemo } from 'react';
import { FiChevronUp, FiChevronDown, FiChevronsUp, FiSearch, FiX, FiSliders } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner.jsx';
import EmptyState from './EmptyState.jsx';
import Pagination from './Pagination.jsx';
import ExportButton from './ExportButton.jsx';
import SearchBar from './SearchBar.jsx';
import Button from './Button.jsx';

const DataTable = ({
  columns,
  data = [],
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  searchValue,
  page: controlledPage,
  totalPages: controlledTotalPages,
  totalItems: controlledTotalItems,
  limit: controlledLimit,
  onPageChange,
  onLimitChange,
  onRowClick,
  actions,
  exportable = false,
  exportFilename = 'export',
  emptyTitle = 'No data found',
  emptyMessage = 'There are no items to display.',
  emptyAction,
  emptyActionLabel,
  onEmptyAction,
  className = '',
  sortable = true,
  selectable = false,
  onSelectionChange,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selectedRows, setSelectedRows] = useState(new Set());

  const searchValue_ = searchValue !== undefined ? searchValue : localSearch;
  const setSearchValue_ = onSearch || setLocalSearch;

  const handleSort = (key) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const safeData = Array.isArray(data) ? data : [];

  const processedData = useMemo(() => {
    let result = [...safeData];
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (typeof aVal === 'string') {
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }
    return result;
  }, [safeData, sortKey, sortDir]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const all = new Set(processedData.map((_, i) => i));
      setSelectedRows(all);
      onSelectionChange?.(all);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.(new Set());
    }
  };

  const handleSelectRow = (index) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedRows(newSet);
    onSelectionChange?.(newSet);
  };

  const clearSearch = () => setSearchValue_('');

  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex-1 w-full sm:max-w-md">
          {searchable && (
            <SearchBar
              value={searchValue_}
              onChange={setSearchValue_}
              placeholder={searchPlaceholder}
              onClear={clearSearch}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          {exportable && (
            <ExportButton
              data={safeData}
              filename={exportFilename}
            />
          )}
          {actions}
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <LoadingSpinner text="Loading data..." />
        ) : safeData.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            message={emptyMessage}
            action={emptyAction}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50">
                {selectable && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedRows.size === processedData.length && processedData.length > 0}
                      className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={`px-4 py-3 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider ${
                      col.sortable !== false && sortable ? 'cursor-pointer hover:text-secondary-700 dark:hover:text-secondary-200 select-none' : ''
                    } ${col.width ? `w-${col.width}` : ''}`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        sortDir === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {processedData.map((row, i) => (
                <tr
                  key={row.id || row._id || i}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-700/50' : 'hover:bg-secondary-50/50 dark:hover:bg-secondary-700/30'
                  } ${selectedRows.has(i) ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(i)}
                        onChange={() => handleSelectRow(i)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-300">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(onPageChange || onLimitChange) && (
        <div className="px-6 py-4 border-t border-secondary-200 dark:border-secondary-700">
          <Pagination
            page={controlledPage || 1}
            totalPages={controlledTotalPages || 1}
              totalItems={controlledTotalItems || safeData.length}
            limit={controlledLimit || 10}
            onPageChange={onPageChange || (() => {})}
            onLimitChange={onLimitChange || (() => {})}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
