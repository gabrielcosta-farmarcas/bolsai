import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Note, NoteAgreementInput, NoteInput, NoteList, NotePatch } from '../types';

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
      // Combinados criados ou fechados aqui também aparecem nas listas de Combinados.
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

export function useAddNoteAgreement() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: NoteAgreementInput }) =>
      apiFetch<Note>(`/api/v1/notes/${noteId}/agreements`, json('POST', input)),
    onSuccess: refresh,
  });
}

// Fechar ou cancelar um combinado da anotação usa a mesma rota da aba Combinados.
export function useChangeNoteAgreement() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'open' | 'done' | 'cancelled' }) =>
      apiFetch<unknown>(`/api/v1/agreements/${id}`, json('PATCH', { status })),
    onSuccess: refresh,
  });
}
