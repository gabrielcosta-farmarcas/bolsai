import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { StringListField } from '@/components/ui/StringListField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { cn } from '@/lib/cn';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type {
  AnalysisContent,
  LeaderFeedback,
  LeaderOverall,
  Owner,
  PreviousStatus,
  ResponsibilityOption,
  SignalKind,
} from '../types';

export type SetField = <K extends keyof AnalysisContent>(
  field: K,
  value: AnalysisContent[K],
) => void;

type PanelProps = {
  draft: AnalysisContent;
  setField: SetField;
};

const OWNER_OPTIONS = [
  { value: 'leader', label: 'Você (líder)' },
  { value: 'report', label: 'A pessoa' },
] as const;

const SIGNAL_OPTIONS = [
  { value: 'growth', label: 'Evolução' },
  { value: 'attention', label: 'Ponto de atenção' },
  { value: 'neutral', label: 'Neutro' },
] as const;

const SIGNAL_DOT: Record<SignalKind, string> = {
  growth: 'bg-success',
  attention: 'bg-warning',
  neutral: 'bg-border-strong',
};

// Chave que liga um combinado ao trecho marcado na transcrição.
export const agreementEvidenceKey = (agreement: { id?: string }, index: number) =>
  agreement.id ?? `n${index}`;
export const previousEvidenceKey = (id: string) => `prev-${id}`;

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-surface border-border grid gap-3 rounded-lg border p-5', className)}>
      {children}
    </div>
  );
}

export function SummaryPanel({ draft, setField }: PanelProps) {
  return (
    <div className="grid gap-6">
      <TextAreaField
        label="Resumo para compartilhar com a pessoa"
        rows={3}
        value={draft.summary}
        onChange={(event) => setField('summary', event.target.value)}
      />
      <section aria-labelledby="temas" className="grid gap-3">
        <h3 id="temas">Temas</h3>
        {draft.themes.map((theme, index) => (
          <Card key={index}>
            <TextField
              label={`Título do tema ${index + 1}`}
              value={theme.title}
              onChange={(event) =>
                setField(
                  'themes',
                  draft.themes.map((t, i) =>
                    i === index ? { ...t, title: event.target.value } : t,
                  ),
                )
              }
            />
            <TextAreaField
              label={`Detalhe do tema ${index + 1}`}
              rows={2}
              value={theme.detail}
              onChange={(event) =>
                setField(
                  'themes',
                  draft.themes.map((t, i) =>
                    i === index ? { ...t, detail: event.target.value } : t,
                  ),
                )
              }
            />
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setField(
                    'themes',
                    draft.themes.filter((_, i) => i !== index),
                  )
                }
              >
                Remover tema {index + 1}
              </Button>
            </div>
          </Card>
        ))}
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setField('themes', [...draft.themes, { title: '', detail: '' }])}
          >
            Adicionar tema
          </Button>
        </div>
      </section>
    </div>
  );
}

type AgreementsPanelProps = PanelProps & {
  previousLabels: Record<string, string>;
  // O que a IA sugeriu para cada combinado anterior (para o botão Aceitar).
  suggestions: Record<string, PreviousStatus>;
  onEvidenceChange: (key: string | undefined) => void;
};

const PREVIOUS_TEXT: Record<PreviousStatus, string> = {
  done: 'A IA sugere: concluído',
  cancelled: 'A IA sugere: cancelado',
  in_progress: 'A IA indica: em andamento',
  not_mentioned: 'A IA indica: não foi citado',
};

export function AgreementsPanel({
  draft,
  setField,
  previousLabels,
  suggestions,
  onEvidenceChange,
}: AgreementsPanelProps) {
  const hoverProps = (key: string) => ({
    onMouseEnter: () => onEvidenceChange(key),
    onMouseLeave: () => onEvidenceChange(undefined),
    onFocus: () => onEvidenceChange(key),
    onBlur: () => onEvidenceChange(undefined),
  });

  return (
    <div className="grid gap-4">
      <p className="text-text-muted">
        Já estão salvos para o próximo encontro. Ao passar o mouse (ou focar) num combinado, o
        trecho de onde veio acende na transcrição.
      </p>

      {draft.agreements.length === 0 ? (
        <p className="text-text-muted">Nenhum combinado novo nesta conversa.</p>
      ) : null}
      {draft.agreements.map((agreement, index) => {
        const update = (patch: Partial<typeof agreement>) =>
          setField(
            'agreements',
            draft.agreements.map((a, i) => (i === index ? { ...a, ...patch } : a)),
          );
        return (
          <Card
            key={agreementEvidenceKey(agreement, index)}
            className="hover:border-accent focus-within:border-accent"
          >
            <div {...hoverProps(agreementEvidenceKey(agreement, index))} className="grid gap-3">
              <TextAreaField
                label={`Combinado ${index + 1}`}
                rows={2}
                value={agreement.description}
                onChange={(event) => update({ description: event.target.value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Responsável"
                  value={agreement.owner}
                  options={OWNER_OPTIONS}
                  onChange={(event) => update({ owner: event.target.value as Owner })}
                />
                <TextField
                  label="Prazo (se foi dito)"
                  type="date"
                  value={agreement.due_date ?? ''}
                  onChange={(event) => update({ due_date: event.target.value || null })}
                />
              </div>
              {agreement.evidence_excerpt ? (
                <p className="text-caption">Na conversa: “{agreement.evidence_excerpt}”</p>
              ) : null}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setField(
                      'agreements',
                      draft.agreements.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remover combinado {index + 1}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setField('agreements', [
              ...draft.agreements,
              { description: '', owner: 'report', due_date: null, evidence_excerpt: '' },
            ])
          }
        >
          Adicionar combinado
        </Button>
      </div>

      {draft.previous_agreements.length > 0 ? (
        <section aria-labelledby="anteriores" className="grid gap-3">
          <h3 id="anteriores">Combinados anteriores</h3>
          <p className="text-text-muted">
            A IA só sugere a situação. Ela muda quando você salva a versão final.
          </p>
          {draft.previous_agreements.map((item, index) => {
            const suggestion = suggestions[item.id] ?? item.suggested_status;
            const canChange = suggestion === 'done' || suggestion === 'cancelled';
            const isAccepted = item.suggested_status === suggestion;
            const setStatus = (status: PreviousStatus) =>
              setField(
                'previous_agreements',
                draft.previous_agreements.map((p, i) =>
                  i === index ? { ...p, suggested_status: status } : p,
                ),
              );
            return (
              <Card key={item.id} className="bg-bg">
                <div {...hoverProps(previousEvidenceKey(item.id))} className="grid gap-3">
                  <p className="text-label">
                    {previousLabels[item.id] ?? 'Combinado que não está mais na lista'}
                  </p>
                  {item.evidence ? <p className="text-caption">“{item.evidence}”</p> : null}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-body-sm">
                      {canChange && isAccepted
                        ? PREVIOUS_TEXT[suggestion]
                        : canChange
                          ? 'Continua em aberto'
                          : PREVIOUS_TEXT[suggestion]}
                    </span>
                    {canChange ? (
                      <div className="flex gap-2">
                        <Button
                          variant={isAccepted ? 'primary' : 'secondary'}
                          size="sm"
                          aria-pressed={isAccepted}
                          onClick={() => setStatus(suggestion)}
                        >
                          Aceitar
                        </Button>
                        <Button
                          variant={isAccepted ? 'ghost' : 'secondary'}
                          size="sm"
                          aria-pressed={!isAccepted}
                          onClick={() => setStatus('in_progress')}
                        >
                          Manter em aberto
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}

export const OUT_OF_SCOPE_LABEL = 'Fora das responsabilidades';

// Opções do seletor: as responsabilidades atuais, "fora" e, se a observação aponta para uma que saiu
// do responsograma, essa também (marcada como anterior) para não perder a escolha.
const responsibilityOptions = (
  responsibilities: ResponsibilityOption[],
  currentId: string | null,
) => {
  const options = [
    { value: '', label: OUT_OF_SCOPE_LABEL },
    ...responsibilities
      .filter((item) => !item.retired)
      .map((item) => ({ value: item.id, label: item.title })),
  ];
  if (currentId && !options.some((option) => option.value === currentId)) {
    const old = responsibilities.find((item) => item.id === currentId);
    options.push({
      value: currentId,
      label: `${old?.title ?? 'Responsabilidade removida'} (anterior)`,
    });
  }
  return options;
};

export function EvolutionPanel({
  draft,
  setField,
  responsibilities = [],
}: PanelProps & { responsibilities?: ResponsibilityOption[] }) {
  return (
    <div className="grid gap-6">
      <section aria-labelledby="sinais" className="grid gap-3">
        <h3 id="sinais">Sinais de evolução</h3>
        {draft.development_signals.length === 0 ? (
          <p className="text-text-muted">Nenhum sinal registrado.</p>
        ) : null}
        {draft.development_signals.map((signal, index) => {
          const update = (patch: Partial<typeof signal>) =>
            setField(
              'development_signals',
              draft.development_signals.map((s, i) => (i === index ? { ...s, ...patch } : s)),
            );
          return (
            <Card key={index}>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn('h-2 w-2 flex-none rounded-full', SIGNAL_DOT[signal.kind])}
                />
                <SelectField
                  label={`Responsabilidade do sinal ${index + 1}`}
                  value={signal.responsibility_id ?? ''}
                  options={responsibilityOptions(responsibilities, signal.responsibility_id)}
                  className="flex-1"
                  onChange={(event) => update({ responsibility_id: event.target.value || null })}
                />
              </div>
              <TextAreaField
                label={`Observação ${index + 1}`}
                rows={2}
                value={signal.observation}
                onChange={(event) => update({ observation: event.target.value })}
              />
              <SelectField
                label={`Tipo do sinal ${index + 1}`}
                value={signal.kind}
                options={SIGNAL_OPTIONS}
                className="max-w-60"
                onChange={(event) => update({ kind: event.target.value as SignalKind })}
              />
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setField(
                      'development_signals',
                      draft.development_signals.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remover sinal {index + 1}
                </Button>
              </div>
            </Card>
          );
        })}
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setField('development_signals', [
                ...draft.development_signals,
                { responsibility_id: null, observation: '', kind: 'neutral' },
              ])
            }
          >
            Adicionar sinal
          </Button>
        </div>
      </section>

      <StringListField
        label="Ponto de atenção"
        items={draft.attention_points}
        addLabel="Adicionar ponto"
        emptyMessage="Nenhum ponto de atenção."
        onChange={(items) => setField('attention_points', items)}
      />
    </div>
  );
}

export function QuestionsPanel({ draft, setField }: PanelProps) {
  return (
    <div className="grid gap-4">
      <p className="text-text-muted">
        Sugestões para abrir a próxima conversa: carreira, bloqueios, motivação, feedback para você.
      </p>
      <StringListField
        label="Pergunta"
        items={draft.next_questions}
        addLabel="Adicionar pergunta"
        emptyMessage="Nenhuma pergunta."
        onChange={(items) => setField('next_questions', items)}
      />
    </div>
  );
}

export function NotesPanel({ draft, setField }: PanelProps) {
  return (
    <div className="grid gap-4">
      <p className="text-text-muted">Só você vê. Nunca entram no resumo exportado.</p>
      <TextAreaField
        label="Suas observações"
        rows={4}
        value={draft.private_leader_notes}
        onChange={(event) => setField('private_leader_notes', event.target.value)}
      />
    </div>
  );
}

const OVERALL_OPTIONS = [
  { value: 'went_well', label: 'Foi bem' },
  { value: 'mixed', label: 'Em parte' },
  { value: 'room_to_improve', label: 'Pode melhorar' },
] as const;

const OVERALL_BADGE = {
  went_well: 'growth',
  mixed: 'neutral',
  room_to_improve: 'attention',
} as const;

const EMPTY_FEEDBACK: LeaderFeedback = {
  overall: 'mixed',
  overall_note: '',
  strengths: [],
  opportunities: [],
};

export function LeaderFeedbackPanel({ draft, setField }: PanelProps) {
  const feedback = draft.leader_feedback ?? EMPTY_FEEDBACK;
  const update = (patch: Partial<LeaderFeedback>) =>
    setField('leader_feedback', { ...feedback, ...patch });

  return (
    <div className="grid gap-6">
      <p className="text-text-muted">
        Só você vê. Não vai para a pessoa nem para o resumo exportado. Baseado no que aparece na
        transcrição: serve para você evoluir, não é uma nota.
      </p>
      {!draft.leader_feedback ? (
        <p className="bg-primary-subtle rounded-lg p-3 text-body-sm">
          Esta análise foi feita antes do feedback existir. Reanalise o encontro para receber um.
        </p>
      ) : null}

      <section aria-labelledby="visao-geral" className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 id="visao-geral">Visão geral</h3>
          <StatusBadge tone={OVERALL_BADGE[feedback.overall]}>
            {OVERALL_OPTIONS.find((option) => option.value === feedback.overall)?.label ?? ''}
          </StatusBadge>
        </div>
        <SelectField
          label="Como foi a condução"
          value={feedback.overall}
          options={OVERALL_OPTIONS}
          className="max-w-60"
          onChange={(event) => update({ overall: event.target.value as LeaderOverall })}
        />
        <TextAreaField
          label="Resumo da condução"
          rows={2}
          value={feedback.overall_note}
          onChange={(event) => update({ overall_note: event.target.value })}
        />
      </section>

      <section aria-labelledby="pontos-fortes" className="grid gap-3">
        <h3 id="pontos-fortes">O que foi bem</h3>
        {feedback.strengths.length === 0 ? (
          <p className="text-text-muted">Nenhum ponto registrado.</p>
        ) : null}
        {feedback.strengths.map((item, index) => (
          <Card key={index}>
            <TextAreaField
              label={`Ponto forte ${index + 1}`}
              rows={2}
              value={item.point}
              onChange={(event) =>
                update({
                  strengths: feedback.strengths.map((s, i) =>
                    i === index ? { ...s, point: event.target.value } : s,
                  ),
                })
              }
            />
            {item.evidence ? <p className="text-caption">Na conversa: “{item.evidence}”</p> : null}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  update({ strengths: feedback.strengths.filter((_, i) => i !== index) })
                }
              >
                Remover ponto forte {index + 1}
              </Button>
            </div>
          </Card>
        ))}
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              update({ strengths: [...feedback.strengths, { point: '', evidence: '' }] })
            }
          >
            Adicionar ponto forte
          </Button>
        </div>
      </section>

      <section aria-labelledby="oportunidades" className="grid gap-3">
        <h3 id="oportunidades">Oportunidades</h3>
        {feedback.opportunities.length === 0 ? (
          <p className="text-text-muted">Nenhuma oportunidade registrada.</p>
        ) : null}
        {feedback.opportunities.map((item, index) => (
          <Card key={index}>
            <TextAreaField
              label={`Oportunidade ${index + 1}`}
              rows={2}
              value={item.point}
              onChange={(event) =>
                update({
                  opportunities: feedback.opportunities.map((o, i) =>
                    i === index ? { ...o, point: event.target.value } : o,
                  ),
                })
              }
            />
            <TextAreaField
              label={`O que fazer no próximo encontro ${index + 1}`}
              rows={2}
              value={item.suggestion}
              onChange={(event) =>
                update({
                  opportunities: feedback.opportunities.map((o, i) =>
                    i === index ? { ...o, suggestion: event.target.value } : o,
                  ),
                })
              }
            />
            {item.evidence ? <p className="text-caption">Na conversa: “{item.evidence}”</p> : null}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  update({ opportunities: feedback.opportunities.filter((_, i) => i !== index) })
                }
              >
                Remover oportunidade {index + 1}
              </Button>
            </div>
          </Card>
        ))}
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              update({
                opportunities: [
                  ...feedback.opportunities,
                  { point: '', suggestion: '', evidence: '' },
                ],
              })
            }
          >
            Adicionar oportunidade
          </Button>
        </div>
      </section>
    </div>
  );
}
