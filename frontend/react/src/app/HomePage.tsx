import { useAuth } from '@/features/auth';
import { HomeSummary, useHomeSummary } from '@/features/home';
import { firstName } from '@/lib/format';

export function HomePage() {
  const { user } = useAuth();
  const name = firstName(user?.name);
  const summary = useHomeSummary();

  return (
    <>
      <h1>{name ? `${name}, bom te ver por aqui` : 'Bom te ver por aqui'}</h1>
      <p className="text-text-muted mt-3 max-w-reading">
        O Bonsai ajuda a preparar cada encontro, entender o que foi dito e acompanhar a evolução de
        cada pessoa entre um encontro e o seguinte.
      </p>
      <div className="mt-8">
        <HomeSummary {...summary} />
      </div>
    </>
  );
}
