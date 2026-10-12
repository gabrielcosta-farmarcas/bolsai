export type ExistingResponsibility = {
  id: string;
  key: string;
  position: number;
  // Aposentada: já saiu do responsograma em alguma versão anterior (o histórico dela continua).
  retired: boolean;
};

export type IncomingResponsibility = { key: string; text: string };

export type ReconcilePlan = {
  keep: Array<{ id: string; position: number }>;
  reactivate: Array<{ id: string; position: number }>;
  create: Array<{ key: string; text: string; position: number }>;
  retire: string[];
};

// Decide o que fazer com as responsabilidades ao salvar uma nova versão do responsograma.
// O histórico acompanha o TEXTO (pela chave), nunca a posição do campo.
export const reconcile = (
  existing: ExistingResponsibility[],
  incoming: IncomingResponsibility[],
): ReconcilePlan => {
  const byKey = new Map(existing.map((item) => [item.key, item]));
  const plan: ReconcilePlan = { keep: [], reactivate: [], create: [], retire: [] };
  const matched = new Set<string>();

  incoming.forEach((item, index) => {
    const position = index + 1;
    const found = byKey.get(item.key);
    if (!found) {
      plan.create.push({ key: item.key, text: item.text, position });
      return;
    }
    matched.add(found.id);
    (found.retired ? plan.reactivate : plan.keep).push({ id: found.id, position });
  });

  plan.retire = existing
    .filter((item) => !item.retired && !matched.has(item.id))
    .map((item) => item.id);
  return plan;
};
