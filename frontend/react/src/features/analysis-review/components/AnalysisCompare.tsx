import { SelectField } from '@/components/ui/SelectField';
import { useAnalysis } from '../hooks/useAnalyses';
import type { AnalysisSummary, ResponsibilityOption } from '../types';
import { AnalysisReadOnly } from './AnalysisReadOnly';

type AnalysisCompareProps = {
  analyses: AnalysisSummary[];
  currentId: string;
  otherId: string | undefined;
  onChangeOther: (id: string | undefined) => void;
  responsibilities?: ResponsibilityOption[];
};

export function AnalysisCompare({
  analyses,
  currentId,
  otherId,
  onChangeOther,
  responsibilities = [],
}: AnalysisCompareProps) {
  const candidates = analyses.filter(
    (item) => item.id !== currentId && item.status === 'completed',
  );
  const other = useAnalysis(otherId);

  if (candidates.length === 0) return null;

  const options = [
    { value: '', label: 'Não comparar' },
    ...candidates.map((item) => ({
      value: item.id,
      label: `Análise de ${new Date(item.createdAt).toLocaleString('pt-BR')}`,
    })),
  ];

  return (
    <div className="mt-6">
      <SelectField
        label="Comparar com outra análise"
        value={otherId ?? ''}
        options={options}
        className="max-w-sm"
        onChange={(event) => onChangeOther(event.target.value || undefined)}
      />
      {otherId ? (
        <div className="border-border bg-surface mt-4 rounded-lg border p-5">
          <h3>Análise para comparar</h3>
          {other.isLoading ? (
            <p role="status" className="text-text-muted mt-2">
              Carregando…
            </p>
          ) : other.data?.rawJson ? (
            <AnalysisReadOnly
              content={other.data.reviewedJson ?? other.data.rawJson}
              responsibilities={responsibilities}
            />
          ) : (
            <p className="text-text-muted mt-2">Não foi possível carregar essa análise.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
