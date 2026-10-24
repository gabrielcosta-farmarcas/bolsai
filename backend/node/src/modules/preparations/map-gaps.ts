// Quantos dos últimos encontros revisados contam como "recentes" para dizer que uma responsabilidade foi conversada.
export const RECENT_SESSIONS = 3;

export type GapHistoryItem = {
  heldOn: string;
  // Responsabilidades que tiveram observação nesse encontro.
  discussedIds: ReadonlySet<string>;
};

export type MapGap = {
  responsibilityId: string;
  title: string;
  lastDiscussedOn: string | null;
};

// Responsabilidades ativas que não apareceram nos últimos encontros revisados.
// `history` vem do mais recente para o mais antigo. Sem histórico não há o que comparar: lista vazia.
export const computeMapGaps = (
  active: ReadonlyArray<{ id: string; title: string }>,
  history: readonly GapHistoryItem[],
): MapGap[] => {
  if (history.length === 0) return [];
  const recent = history.slice(0, RECENT_SESSIONS);
  return active
    .filter((item) => !recent.some((session) => session.discussedIds.has(item.id)))
    .map((item) => ({
      responsibilityId: item.id,
      title: item.title,
      lastDiscussedOn: history.find((session) => session.discussedIds.has(item.id))?.heldOn ?? null,
    }));
};
