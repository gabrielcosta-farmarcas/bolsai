export type Page<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
};
