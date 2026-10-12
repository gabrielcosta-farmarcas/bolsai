import { AgreementsOverview } from '@/features/agreements';
import { useDirectReports } from '@/features/direct-reports';

export function AgreementsPage() {
  const people = useDirectReports('all');

  return (
    <>
      <h1>Combinados</h1>
      <p className="text-text-muted mt-1">
        O que ficou combinado em cada encontro, para a próxima conversa.
      </p>
      <div className="mt-6">
        <AgreementsOverview people={people.data?.data ?? []} />
      </div>
    </>
  );
}
