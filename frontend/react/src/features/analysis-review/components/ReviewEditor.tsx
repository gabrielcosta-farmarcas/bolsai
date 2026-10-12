import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { useReviewDraft } from '../hooks/useReviewDraft';
import type { AnalysisContent, PreviousStatus, ResponsibilityOption } from '../types';
import {
  AgreementsPanel,
  EvolutionPanel,
  LeaderFeedbackPanel,
  NotesPanel,
  QuestionsPanel,
  SummaryPanel,
} from './ReviewPanels';

type ReviewEditorProps = {
  initial: AnalysisContent;
  // Texto dos combinados anteriores (por id), para mostrar o que a IA está sugerindo atualizar.
  previousLabels?: Record<string, string>;
  // Responsabilidades da pessoa para escolher em cada sinal de evolução.
  responsibilities?: ResponsibilityOption[];
  isSaving: boolean;
  errorMessage?: string;
  // Texto de apoio à esquerda do rodapé (ex.: quantos combinados já estão salvos).
  footerNote?: ReactNode;
  // Avisa qual trecho da transcrição destacar (combinado sob o mouse ou o foco).
  onEvidenceChange?: (key: string | undefined) => void;
  onSave: (content: AnalysisContent) => void;
};

// Revisão em abas, com o rodapé sempre à vista: descartar edições e salvar a versão final.
export function ReviewEditor({
  initial,
  previousLabels = {},
  responsibilities = [],
  isSaving,
  errorMessage,
  footerNote,
  onEvidenceChange = () => {},
  onSave,
}: ReviewEditorProps) {
  const { draft, setField, problems, toSave, isDirty, reset } = useReviewDraft(initial);
  const [tab, setTab] = useState('resumo');

  const suggestions = Object.fromEntries(
    initial.previous_agreements.map((item) => [item.id, item.suggested_status]),
  ) as Record<string, PreviousStatus>;

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (problems.length === 0) onSave(toSave());
      }}
      noValidate
    >
      <Tabs
        label="Seções da análise"
        selectedId={tab}
        onSelect={setTab}
        className="flex min-h-0 flex-1 flex-col"
        listClassName="px-6 md:px-8"
        panelClassName="min-h-0 flex-1 overflow-auto p-6 md:p-8"
        items={[
          {
            id: 'resumo',
            label: 'Resumo',
            content: <SummaryPanel draft={draft} setField={setField} />,
          },
          {
            id: 'combinados',
            label: 'Combinados',
            count: draft.agreements.length,
            content: (
              <AgreementsPanel
                draft={draft}
                setField={setField}
                previousLabels={previousLabels}
                suggestions={suggestions}
                onEvidenceChange={onEvidenceChange}
              />
            ),
          },
          {
            id: 'evolucao',
            label: 'Evolução',
            content: (
              <EvolutionPanel
                draft={draft}
                setField={setField}
                responsibilities={responsibilities}
              />
            ),
          },
          {
            id: 'perguntas',
            label: 'Perguntas',
            count: draft.next_questions.length,
            content: <QuestionsPanel draft={draft} setField={setField} />,
          },
          {
            id: 'feedback',
            label: 'Seu feedback',
            content: <LeaderFeedbackPanel draft={draft} setField={setField} />,
          },
          {
            id: 'notas',
            label: 'Notas privadas',
            content: <NotesPanel draft={draft} setField={setField} />,
          },
        ]}
      />

      <footer className="bg-surface border-border flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-6 py-3 md:px-8">
        <div className="text-caption grid gap-1">
          {problems.length > 0 ? (
            <ul role="alert" className="text-danger list-disc pl-4">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          ) : null}
          {errorMessage ? (
            <p role="alert" className="text-danger">
              {errorMessage}
            </p>
          ) : null}
          {footerNote}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={reset} disabled={!isDirty || isSaving}>
            Descartar edições
          </Button>
          <Button type="submit" disabled={isSaving || problems.length > 0}>
            {isSaving ? 'Salvando…' : 'Salvar versão final'}
          </Button>
        </div>
      </footer>
    </form>
  );
}
