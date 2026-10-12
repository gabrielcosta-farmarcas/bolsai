import { useAgreementsOverview } from '@/features/agreements';
import { useDirectReports } from '@/features/direct-reports';

// Números da página inicial, a partir das listas que o app já busca.
export function useHomeSummary() {
  const people = useDirectReports('active');
  const open = useAgreementsOverview('open', '');
  const overdue = useAgreementsOverview('overdue', '');

  return {
    isLoading: people.isLoading || open.isLoading || overdue.isLoading,
    hasError: Boolean(people.error || open.error || overdue.error),
    people: people.data?.meta.total ?? 0,
    openAgreements: open.data?.meta.total ?? 0,
    overdueAgreements: overdue.data?.meta.total ?? 0,
  };
}
