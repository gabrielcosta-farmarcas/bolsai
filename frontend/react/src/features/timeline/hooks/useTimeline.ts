import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Timeline } from '../types';

export function useTimeline(directReportId: string) {
  return useQuery({
    queryKey: ['timeline', directReportId] as const,
    queryFn: () => apiFetch<Timeline>(`/api/v1/direct-reports/${directReportId}/timeline`),
    enabled: directReportId.length > 0,
  });
}
