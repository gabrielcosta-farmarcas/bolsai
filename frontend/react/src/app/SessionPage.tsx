import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Loading } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ReviewEditor,
  TranscriptPane,
  agreementEvidenceKey,
  previousEvidenceKey,
  useAnalyses,
  useAnalysis,
  useSaveReview,
  useStartAnalysis,
  withSavedAgreements,
} from '@/features/analysis-review';
import { useReportAgreements, useSessionAgreements } from '@/features/agreements';
import { useDirectReport } from '@/features/direct-reports';
import { useResponsibilities } from '@/features/responsibilities';
import { SummaryActions, useSession } from '@/features/sessions';
import { formatCalendarDate } from '@/lib/format';

export function SessionPage() {
  const { id = '' } = useParams();
  const session = useSession(id);
  const report = useDirectReport(session.data?.directReportId ?? '');
  // Com as aposentadas, para mostrar o título certo em análises antigas.
  const responsibilities = useResponsibilities(session.data?.directReportId ?? '', {
    includeRetired: true,
  });
  const responsibilityOptions = (responsibilities.data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    retired: item.retired,
  }));
  const analyses = useAnalyses(id);
  const start = useStartAnalysis(id);
  const location = useLocation();
  const sessionAgreements = useSessionAgreements(id);
  const reportAgreements = useReportAgreements(session.data?.directReportId ?? '');
  const save = useSaveReview(id);

  const [selectedId, setSelectedId] = useState<string>();
  const [activeEvidence, setActiveEvidence] = useState<string>();

  const list = analyses.data ?? [];
  const finalAnalysis = list.find((item) => item.isFinal);
  const effectiveId = selectedId ?? finalAnalysis?.id ?? list[0]?.id;
  const analysis = useAnalysis(effectiveId);

  if (session.isLoading) {
    return (
      <p role="status" className="text-text-muted">
        Carregando…
      </p>
    );
  }
  if (session.error || !session.data) {
    return (
      <div className="max-w-reading">
        <h1>Não achamos este encontro</h1>
        <Link to="/pessoas" className="text-primary mt-6 inline-block underline underline-offset-4">
          Voltar para Pessoas
        </Link>
      </div>
    );
  }

  const current = list.find((item) => item.id === effectiveId);
  const baseContent = analysis.data?.reviewedJson ?? analysis.data?.rawJson ?? null;
  const content =
    baseContent && effectiveId
      ? withSavedAgreements(
          baseContent,
          sessionAgreements.data,
          effectiveId,
          current?.isFinal ?? false,
        )
      : null;
  const previousLabels = Object.fromEntries(
    (reportAgreements.data ?? []).map((item) => [item.id, item.description]),
  );
  const initialAnalysisError = (location.state as { analysisError?: string } | null)?.analysisError;
  const savedCount = (sessionAgreements.data ?? []).filter(
    (item) => item.status !== 'cancelled',
  ).length;

  const evidence = [
    ...(content?.agreements ?? []).flatMap((agreement, index) =>
      agreement.evidence_excerpt
        ? [{ key: agreementEvidenceKey(agreement, index), text: agreement.evidence_excerpt }]
        : [],
    ),
    ...(content?.previous_agreements ?? []).flatMap((item) =>
      item.evidence ? [{ key: previousEvidenceKey(item.id), text: item.evidence }] : [],
    ),
  ];
  const analysisNumber = current ? list.length - list.indexOf(current) : 0;

  const handleStart = () =>
    start.mutate(undefined, { onSuccess: (created) => setSelectedId(created.id) });

  return (
    <div className="flex flex-col lg:h-full lg:min-h-0">
      <header className="bg-bg border-border flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b px-6 py-5 md:px-8">
        <div className="flex items-center gap-4">
          <Avatar name={report.data?.name ?? ''} className="size-14 text-h3" />
          <div>
            <h1 className="text-h1">
              <Link
                to={`/pessoas/${session.data.directReportId}`}
                className="rounded-md underline-offset-4 hover:underline"
              >
                {report.data?.name ?? 'Voltar para a pessoa'}
              </Link>
            </h1>
            <p className="text-text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                {report.data?.role ? `${report.data.role} · ` : ''}
                Encontro de {formatCalendarDate(session.data.heldOn)}
              </span>
              {session.data.status === 'reviewed' ? (
                <StatusBadge tone="growth">Revisado</StatusBadge>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {session.data.status === 'reviewed' ? <SummaryActions sessionId={id} /> : null}
          {current ? (
            <span className="text-caption">
              Análise {analysisNumber} ·{' '}
              {current.status === 'processing'
                ? 'analisando…'
                : current.status === 'failed'
                  ? 'falhou'
                  : 'pronta'}
              {current.isFinal ? ' · versão final' : ''}
            </span>
          ) : null}
          <Button
            variant={list.length === 0 ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleStart}
            disabled={start.isPending || current?.status === 'processing'}
          >
            {list.length === 0 ? 'Analisar' : 'Analisar de novo'}
          </Button>
        </div>
      </header>

      <div className="grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="bg-bg border-border flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
          <TranscriptPane
            transcript={session.data.transcript}
            evidence={evidence}
            activeKey={activeEvidence}
          />
        </div>

        <section aria-label="Análise" className="flex min-h-0 flex-col">
          {initialAnalysisError && !start.error && list.length === 0 ? (
            <p role="alert" className="text-danger text-body-sm p-6 md:p-8">
              O encontro foi salvo, mas a análise não começou: {initialAnalysisError}
            </p>
          ) : null}
          {start.error ? (
            <p role="alert" className="text-danger text-body-sm p-6 md:p-8">
              {start.error.message}
            </p>
          ) : null}

          {list.length === 0 && !initialAnalysisError && !start.error ? (
            <p className="text-text-muted p-6 md:p-8">
              Ainda não há análise. Use Analisar para a IA ler a conversa e guardar os combinados.
            </p>
          ) : null}

          {current?.status === 'processing' ? (
            <Loading
              label="Analisando a conversa…"
              hint="Isso pode levar alguns instantes. Você pode sair desta tela e voltar."
              className="p-6 md:p-8 lg:my-auto"
            />
          ) : null}

          {current?.status === 'failed' ? (
            <p
              role="alert"
              className="bg-danger-subtle border-danger text-danger m-6 rounded-lg border p-4 md:m-8"
            >
              {current.errorMessage ?? 'A análise falhou.'}
            </p>
          ) : null}

          {current?.status === 'completed' && content && effectiveId ? (
            <>
              {finalAnalysis && !current.isFinal ? (
                <p className="bg-primary-subtle text-body-sm mx-6 mt-4 rounded-lg p-3 md:mx-8">
                  Esta análise ainda não é a versão final. A atual continua valendo até você salvar
                  esta.
                </p>
              ) : null}
              <ReviewEditor
                key={`${effectiveId}-${current.reviewedAt ?? 'novo'}`}
                initial={content}
                previousLabels={previousLabels}
                responsibilities={responsibilityOptions}
                isSaving={save.isPending}
                errorMessage={save.error?.message}
                onEvidenceChange={setActiveEvidence}
                footerNote={
                  save.isSuccess ? (
                    <span role="status" className="text-success">
                      Versão final salva.
                    </span>
                  ) : savedCount > 0 ? (
                    <span>
                      {savedCount} {savedCount === 1 ? 'combinado salvo' : 'combinados salvos'} para
                      o próximo encontro.{' '}
                      <Link
                        to={`/pessoas/${session.data.directReportId}?aba=combinados`}
                        className="text-primary underline underline-offset-4"
                      >
                        Ver combinados
                      </Link>
                    </span>
                  ) : null
                }
                onSave={(reviewedJson) => save.mutate({ analysisId: effectiveId, reviewedJson })}
              />
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
