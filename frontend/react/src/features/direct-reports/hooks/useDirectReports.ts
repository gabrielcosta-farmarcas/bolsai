import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Page } from '@/lib/types';
import type { DirectReport, DirectReportInput, StatusFilter } from '../types';

const BASE = '/api/v1/direct-reports';
const LIST_PAGE_SIZE = 100;

export const directReportKeys = {
  all: ['direct-reports'] as const,
  list: (status: StatusFilter) => ['direct-reports', 'list', status] as const,
  detail: (id: string) => ['direct-reports', 'detail', id] as const,
};

export function useDirectReports(status: StatusFilter) {
  return useQuery({
    queryKey: directReportKeys.list(status),
    queryFn: () => {
      const query = new URLSearchParams({ pageSize: String(LIST_PAGE_SIZE) });
      if (status !== 'all') query.set('status', status);
      return apiFetch<Page<DirectReport>>(`${BASE}?${query.toString()}`);
    },
  });
}

export function useDirectReport(id: string) {
  return useQuery({
    queryKey: directReportKeys.detail(id),
    queryFn: () => apiFetch<DirectReport>(`${BASE}/${id}`),
  });
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export function useCreateDirectReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DirectReportInput) => apiFetch<DirectReport>(BASE, jsonInit('POST', input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: directReportKeys.all }),
  });
}

export function useUpdateDirectReport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<DirectReportInput>) =>
      apiFetch<DirectReport>(`${BASE}/${id}`, jsonInit('PATCH', input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: directReportKeys.all }),
  });
}

export function useDeleteDirectReport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: directReportKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: ['direct-reports', 'list'] });
    },
  });
}
