import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import type { AnalysisSummary, AnalysisStatus } from '../types';

const STATUS_LABEL: Record<AnalysisStatus, string> = {
  processing: 'analisando…',
  completed: 'pronta',
  failed: 'falhou',
};

type AnalysisPickerProps = {
  analyses: AnalysisSummary[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
};

// Lista as análises da sessão (cada reprocessamento gera uma); a final aparece marcada.
export function AnalysisPicker({ analyses, selectedId, onSelect }: AnalysisPickerProps) {
  return (
    <ul className="grid gap-2" aria-label="Análises deste encontro">
      {analyses.map((analysis, index) => {
        const isSelected = analysis.id === selectedId;
        return (
          <li key={analysis.id}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(analysis.id)}
              className={cn(
                'w-full rounded-lg border px-4 py-3 text-left text-body-sm',
                '',
                isSelected
                  ? 'border-primary bg-primary-subtle'
                  : 'border-border hover:bg-primary-subtle',
              )}
            >
              <span className="block font-semibold">
                Análise {analyses.length - index}
                {analysis.isFinal ? ' · versão final' : ''}
              </span>
              <span className="text-text-muted block">
                {formatDateTime(analysis.createdAt)} · {STATUS_LABEL[analysis.status]}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
