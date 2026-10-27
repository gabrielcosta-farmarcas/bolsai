import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import {
  DirectReportForm,
  ResponsibilityMapSection,
  useDeleteDirectReport,
  useDirectReport,
  useResponsibilityMaps,
  useUpdateDirectReport,
  useSaveResponsibilityMap,
} from '@/features/direct-reports';
import { ReportAgreements, useReportAgreements } from '@/features/agreements';
import {
  useExtractProposal,
  useRenameResponsibility,
  useResponsibilities,
} from '@/features/responsibilities';
import { NextSessionNotes, NotesPanel, useNotes } from '@/features/notes';
import { PreparationPanel, usePreparation, useStartPreparation } from '@/features/preparation';
import { SessionList, useSessions } from '@/features/sessions';
import { Timeline, useTimeline } from '@/features/timeline';
import { formatCalendarDate } from '@/lib/format';

const DEFAULT_TAB = 'encontros';
const VALID_TABS = [
  'encontros',
  'preparar',
  'combinados',
  'anotacoes',
  'linha-do-tempo',
  'responsograma',
];

export function DirectReportPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const report = useDirectReport(id);
  const update = useUpdateDirectReport(id);
  const remove = useDeleteDirectReport(id);
  const maps = useResponsibilityMaps(id);
  const saveMap = useSaveResponsibilityMap(id);
  const responsibilities = useResponsibilities(id);
  const rename = useRenameResponsibility(id);
  const extract = useExtractProposal();
  const sessions = useSessions(id);
  const agreements = useReportAgreements(id);
  const notes = useNotes(id);
  const timeline = useTimeline(id);
  const preparation = usePreparation(id);
  const startPreparation = useStartPreparation(id);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('aba') ?? DEFAULT_TAB;
  const tab = VALID_TABS.includes(requestedTab) ? requestedTab : DEFAULT_TAB;
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (report.isLoading) {
    return (
      <p role="status" className="text-text-muted">
        Carregando…
      </p>
    );
  }

  if (report.error || !report.data) {
    return (
      <>
        <h1>Pessoa não encontrada</h1>
        <p className="text-text-muted mt-3">Essa pessoa não existe ou foi excluída.</p>
        <Link to="/pessoas" className="text-primary mt-6 inline-block underline underline-offset-4">
          Voltar para Pessoas
        </Link>
      </>
    );
  }

  const person = report.data;

  return (
    <>
      <p className="text-body-sm">
        <Link to="/pessoas" className="text-primary underline underline-offset-4">
          Pessoas
        </Link>
      </p>

      {(location.state as { sessionDeleted?: boolean } | null)?.sessionDeleted ? (
        <p role="status" className="bg-primary-subtle text-body-sm mt-3 rounded-lg p-3">
          Encontro apagado.
        </p>
      ) : null}

      {isEditing ? (
        <div className="mt-6">
          <h1 className="mb-6">Editar {person.name}</h1>
          <DirectReportForm
            initialValues={{
              name: person.name,
              role: person.role,
              startedAt: person.startedAt,
              status: person.status,
            }}
            submitLabel="Salvar"
            isSubmitting={update.isPending}
            errorMessage={update.error?.message}
            onSubmit={(values) => update.mutate(values, { onSuccess: () => setIsEditing(false) })}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <header className="mt-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1>{person.name}</h1>
            {person.status === 'inactive' ? <StatusBadge>Inativa</StatusBadge> : null}
          </div>
          <p className="text-text-muted mt-1">
            {person.role} · no seu time desde {formatCalendarDate(person.startedAt)}
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmingDelete(true)}>
              Excluir
            </Button>
          </div>
        </header>
      )}

      <div className="mt-10">
        <Tabs
          label="Seções da pessoa"
          selectedId={tab}
          onSelect={(next) =>
            setSearchParams(next === DEFAULT_TAB ? {} : { aba: next }, { replace: true })
          }
          items={[
            {
              id: 'encontros',
              label: 'Encontros',
              count: sessions.data?.length,
              content: (
                <section aria-label="Encontros">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-text-muted">Do mais recente para o mais antigo.</p>
                    <ButtonLink to={`/pessoas/${id}/novo-encontro`}>Novo encontro</ButtonLink>
                  </div>
                  <div className="mt-4">
                    <SessionList
                      sessions={sessions.data}
                      isLoading={sessions.isLoading}
                      errorMessage={sessions.error?.message}
                    />
                  </div>
                </section>
              ),
            },
            {
              id: 'preparar',
              label: 'Preparar 1:1',
              content: (
                <>
                  <NextSessionNotes directReportId={id} />
                  <PreparationPanel
                    preparation={preparation.data}
                    isLoading={preparation.isLoading}
                    loadError={preparation.error?.message}
                    isStarting={startPreparation.isPending}
                    startError={startPreparation.error?.message}
                    onStart={() => startPreparation.mutate()}
                  />
                </>
              ),
            },
            {
              id: 'combinados',
              label: 'Combinados',
              count: agreements.data?.filter((item) => item.status === 'open').length,
              content: <ReportAgreements directReportId={id} />,
            },
            {
              id: 'anotacoes',
              label: 'Anotações',
              count: notes.data?.counts.all,
              content: <NotesPanel directReportId={id} />,
            },
            {
              id: 'linha-do-tempo',
              label: 'Linha do tempo',
              content: (
                <Timeline
                  timeline={timeline.data}
                  isLoading={timeline.isLoading}
                  errorMessage={timeline.error?.message}
                  onRetry={() => void timeline.refetch()}
                />
              ),
            },
            {
              id: 'responsograma',
              label: 'Responsograma',
              count: maps.data?.length,
              content: (
                <ResponsibilityMapSection
                  maps={maps.data}
                  responsibilities={responsibilities.data}
                  isLoading={maps.isLoading}
                  isSaving={saveMap.isPending}
                  loadError={maps.error?.message}
                  saveError={saveMap.error?.message}
                  isRenaming={rename.isPending}
                  renameError={rename.error?.message}
                  onSave={(payload) => saveMap.mutate(payload)}
                  onRename={(responsibilityId, title) =>
                    rename.mutate({ id: responsibilityId, title })
                  }
                  onExtract={(file) => extract.mutateAsync(file)}
                />
              ),
            },
          ]}
        />
      </div>

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title={`Excluir ${person.name}?`}
        description="A pessoa e tudo o que está ligado a ela (responsogramas, encontros e combinados) deixam de aparecer no Bonsai."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        isBusy={remove.isPending}
        errorMessage={remove.error?.message}
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => void navigate('/pessoas') })}
      />
    </>
  );
}
