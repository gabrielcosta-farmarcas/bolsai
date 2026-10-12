const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export type PageMeta = { page: number; pageSize: number; total: number };
export type Page<T> = { data: T[]; meta: PageMeta };

export const normalizePage = (page = 1, pageSize = DEFAULT_PAGE_SIZE) => {
  const safePage = Math.max(1, Math.trunc(page));
  const safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(pageSize)));
  return { page: safePage, pageSize: safeSize, skip: (safePage - 1) * safeSize, take: safeSize };
};

export const toPage = <T>(data: T[], total: number, page: number, pageSize: number): Page<T> => ({
  data,
  meta: { page, pageSize, total },
});
