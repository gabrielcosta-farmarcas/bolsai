import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Settings } from '../types';

export const settingsKey = ['settings'] as const;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function useSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => apiFetch<Settings>('/api/v1/settings'),
  });
}

// Toda alteração devolve a configuração atualizada: a tela passa a mostrá-la sem nova consulta.
function useSettingsMutation<TInput>(request: (input: TInput) => Promise<Settings>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (settings) => queryClient.setQueryData(settingsKey, settings),
  });
}

const send = (path: string, method: 'PUT' | 'DELETE', body?: unknown) =>
  apiFetch<Settings>(`/api/v1/settings/${path}`, {
    method,
    ...(body === undefined ? {} : { headers: JSON_HEADERS, body: JSON.stringify(body) }),
  });

export const useSaveApiKey = () =>
  useSettingsMutation((apiKey: string) => send('api-key', 'PUT', { apiKey }));
export const useRemoveApiKey = () => useSettingsMutation(() => send('api-key', 'DELETE'));
export const useSaveModel = () =>
  useSettingsMutation((model: string) => send('model', 'PUT', { model }));
export const useSavePrompt = () =>
  useSettingsMutation((text: string) => send('prompt', 'PUT', { text }));
export const useResetPrompt = () => useSettingsMutation(() => send('prompt', 'DELETE'));
