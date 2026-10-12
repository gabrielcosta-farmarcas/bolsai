import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { responsibilityKeys } from '@/features/responsibilities';
import { apiFetch } from '@/lib/api';
import type { MapSave, ResponsibilityMap } from '../types';

const mapsKey = (directReportId: string) => ['direct-reports', 'maps', directReportId] as const;

export function useResponsibilityMaps(directReportId: string) {
  return useQuery({
    queryKey: mapsKey(directReportId),
    queryFn: () =>
      apiFetch<ResponsibilityMap[]>(`/api/v1/direct-reports/${directReportId}/responsibility-maps`),
  });
}

// Salva uma nova versão do responsograma (missão + lista de responsabilidades).
export function useSaveResponsibilityMap(directReportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MapSave) =>
      apiFetch<ResponsibilityMap>(`/api/v1/direct-reports/${directReportId}/responsibility-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mapsKey(directReportId) });
      await queryClient.invalidateQueries({ queryKey: responsibilityKeys.list(directReportId) });
      // A evolução usa as responsabilidades: recarrega também.
      await queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}
