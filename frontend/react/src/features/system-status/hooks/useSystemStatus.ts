import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export type SystemStatus = 'ok' | 'unavailable';

type ReadyResponse = { status: 'ok' };

export function useSystemStatus() {
  return useQuery<SystemStatus>({
    queryKey: ['system-status'],
    queryFn: async () => {
      try {
        await apiFetch<ReadyResponse>('/health/ready');
        return 'ok';
      } catch {
        return 'unavailable';
      }
    },
    refetchInterval: 15_000,
  });
}
