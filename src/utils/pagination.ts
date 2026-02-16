import type { PaginationMeta } from '../types/index.js';

export function parsePagination(page = 1, pageSize = 12) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(50, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;

  return { offset, limit: safePageSize, page: safePage, pageSize: safePageSize };
}

export function buildPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
