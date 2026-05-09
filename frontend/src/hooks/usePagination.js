import { useState, useMemo } from 'react';

const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const paginationParams = useMemo(() => ({ page, limit }), [page, limit]);

  const updatePagination = (data) => {
    if (data.pagination) {
      setTotalItems(data.pagination.totalItems || data.pagination.total || 0);
      setTotalPages(data.pagination.totalPages || Math.ceil((data.pagination.total || 0) / limit));
    } else {
      setTotalItems(data.total || data.count || 0);
    }
  };

  const nextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const reset = () => {
    setPage(1);
    setLimit(initialLimit);
    setTotalItems(0);
    setTotalPages(0);
  };

  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page, limit, totalItems, totalPages,
    paginationParams, updatePagination,
    nextPage, prevPage, goToPage, changeLimit, reset,
    hasNext, hasPrev, setPage, setTotalItems,
  };
};

export default usePagination;
