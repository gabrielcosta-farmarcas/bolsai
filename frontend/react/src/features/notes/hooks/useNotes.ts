import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Note, NoteInput, NoteList, NotePatch, StepInput, StepPatch } from '../types';

export const noteKeys = {
  all: ['notes'] as const,
  byReport: (directReportId: string) => ['notes', 'by-report', directReportId] as const,
  nextSession: (directReportId: string) => ['notes', 'next-session', directReportId] as const,
};

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export function useNotes(directReportId: string) {
  return useQuery({
    queryKey: noteKeys.byReport(directReportId),
    queryFn: () => apiFetch<NoteList>(`/api/v1/direct-reports/${directReportId}/notes`),
    enabled: directReportId.length > 0,
  });
}

// Anotações que você quer lembrar no próximo encontro (marcadas e ainda não resolvidas).
export function useNotesForNextSession(directReportId: string) {
  return useQuery({
    queryKey: noteKeys.nextSession(directReportId),
    queryFn: () =>
      apiFetch<Note[]>(`/api/v1/direct-reports/${directReportId}/notes/for-next-session`),
    enabled: directReportId.length > 0,
  });
}

function useRefresh() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: noteKeys.all }),
      // Virar combinado cria um Combinado: as listas dele também mudam.
      queryClient.invalidateQueries({ queryKey: ['agreements'] }),
      queryClient.invalidateQueries({ queryKey: ['timeline'] }),
    ]);
}

export function useCreateNote(directReportId: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (input: NoteInput) =>
      apiFetch<Note>(`/api/v1/direct-reports/${directReportId}/notes`, json('POST', input)),
    onSuccess: refresh,
  });
}

export function useUpdateNote() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: NotePatch }) =>
      apiFetch<Note>(`/api/v1/notes/${id}`, json('PATCH', patch)),
    onSuccess: refresh,
  });
}

export function useDeleteNote() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/v1/notes/${id}`, json('DELETE')),
    onSuccess: refresh,
  });
}

export function useAddStep() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: StepInput }) =>
      apiFetch<Note>(`/api/v1/notes/${noteId}/steps`, json('POST', input)),
    onSuccess: refresh,
  });
}

export function useUpdateStep() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ noteId, stepId, patch }: { noteId: string; stepId: string; patch: StepPatch }) =>
      apiFetch<Note>(`/api/v1/notes/${noteId}/steps/${stepId}`, json('PATCH', patch)),
    onSuccess: refresh,
  });
}

export function useRemoveStep() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ noteId, stepId }: { noteId: string; stepId: string }) =>
      apiFetch<Note>(`/api/v1/notes/${noteId}/steps/${stepId}`, json('DELETE')),
    onSuccess: refresh,
  });
}

export function usePromoteStep() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ noteId, stepId }: { noteId: string; stepId: string }) =>
      apiFetch<Note>(`/api/v1/notes/${noteId}/steps/${stepId}/agreement`, json('POST')),
    onSuccess: refresh,
  });
}
