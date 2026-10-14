import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TextAreaField } from '@/components/ui/TextAreaField';
import {
  ResponsibilityFields,
  ResponsibilityFileImport,
  ResponsibilityTitle,
  emptyFields,
  fieldsFrom,
  filledTexts,
  rulesMessage,
  type Proposal,
  type Responsibility,
} from '@/features/responsibilities';
import { formatDateTime } from '@/lib/format';
import { behaviorsError, type MapSave, type ResponsibilityMap } from '../types';

type ResponsibilityMapSectionProps = {
  maps: ResponsibilityMap[] | undefined;
  // Responsabilidades ativas da pessoa (títulos e frases completas).
  responsibilities: Responsibility[] | undefined;
  isLoading: boolean;
  isSaving: boolean;
  loadError?: string;
  saveError?: string;
  isRenaming?: boolean;
  renameError?: string;
  onSave: (save: MapSave) => void;
  onRename: (id: string, title: string) => void;
  onExtract: (file: File) => Promise<Proposal>;
};

type MapFormProps = {
  initialMission: string;
  initialBehaviors: string;
  initialResponsibilities: string[];
  isSaving: boolean;
  saveError?: string;
  onSave: (save: MapSave) => void;
  onExtract: (file: File) => Promise<Proposal>;
};

// Nova versão: parte da versão vigente (para editar só o que mudou) ou de um arquivo.
function MapForm({
  initialMission,
  initialBehaviors,
  initialResponsibilities,
  isSaving,
  saveError,
  onSave,
  onExtract,
}: MapFormProps) {
  const [mission, setMission] = useState(initialMission);
  const [behaviors, setBehaviors] = useState(initialBehaviors);
  const [values, setValues] = useState(initialResponsibilities);
  const [error, setError] = useState<string>();
  const [behaviorsMessage, setBehaviorsMessage] = useState<string>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = rulesMessage(values);
    const tooLong = behaviorsError(behaviors);
    setError(message);
    setBehaviorsMessage(tooLong);
    if (message || tooLong) return;
    onSave({
      mission: mission.trim(),
      behaviors: behaviors.trim(),
      responsibilities: filledTexts(values),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-surface border-border mt-6 rounded-lg border"
      aria-label="Nova versão do responsograma"
    >
      <div className="grid gap-5 p-6 md:p-8">
        <h3>Nova versão</h3>
        <TextAreaField
          label="Missão / finalidade do cargo (opcional)"
          rows={3}
          value={mission}
          onChange={(event) => setMission(event.target.value)}
        />
        <ResponsibilityFileImport
          onExtract={onExtract}
          onProposal={(proposal) => {
            setValues(fieldsFrom(proposal.responsibilities));
            if (proposal.mission) setMission(proposal.mission);
            setError(undefined);
          }}
        />
        <ResponsibilityFields values={values} onChange={setValues} errorMessage={error} />
        <TextAreaField
          label="Comportamentos desejados (opcional)"
          rows={4}
          value={behaviors}
          onChange={(event) => setBehaviors(event.target.value)}
          errorMessage={behaviorsMessage}
        />
        {saveError ? (
          <p role="alert" className="text-danger text-body-sm">
            {saveError}
          </p>
        ) : null}
      </div>
      <div className="border-border flex justify-end border-t px-6 py-4 md:px-8">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando…' : 'Salvar nova versão'}
        </Button>
      </div>
    </form>
  );
}

export function ResponsibilityMapSection({
  maps,
  responsibilities,
  isLoading,
  isSaving,
  loadError,
  saveError,
  isRenaming = false,
  renameError,
  onSave,
  onRename,
  onExtract,
}: ResponsibilityMapSectionProps) {
  const current = maps?.find((map) => map.isCurrent);
  const active = (responsibilities ?? []).filter((item) => !item.retired);

  return (
    <section aria-label="Responsograma">
      <p className="text-text-muted">
        Cada envio vira uma nova versão. As análises usam sempre a mais recente, com todas as
        responsabilidades preenchidas.
      </p>

      {active.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-h3">Responsabilidades atuais</h3>
          <ol className="bg-surface border-border divide-border mt-3 divide-y overflow-hidden rounded-lg border">
            {active.map((item) => (
              <li key={item.id} className="grid gap-2 px-5 py-4">
                <ResponsibilityTitle
                  responsibility={item}
                  isSaving={isRenaming}
                  errorMessage={renameError}
                  onSave={(title) => onRename(item.id, title)}
                />
                <p className="text-text-muted whitespace-pre-line">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="text-h3">Versões</h3>
        {isLoading ? (
          <p role="status" className="text-text-muted mt-3">
            Carregando versões…
          </p>
        ) : loadError ? (
          <p role="alert" className="text-danger mt-3">
            {loadError}
          </p>
        ) : !maps || maps.length === 0 ? (
          <p className="text-text-muted mt-3">
            Ainda não há responsograma. Preencha as responsabilidades abaixo.
          </p>
        ) : (
          <ul className="bg-surface border-border divide-border mt-3 divide-y overflow-hidden rounded-lg border">
            {maps.map((map) => (
              <li key={map.id} className="grid gap-3 px-5 py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold">Versão {map.version}</span>
                  {map.isCurrent ? <StatusBadge tone="growth">Vigente</StatusBadge> : null}
                  <span className="text-text-muted text-body-sm">
                    {formatDateTime(map.createdAt)}
                  </span>
                </div>
                {map.mission || map.responsibilities || map.behaviors ? (
                  <details>
                    <summary className="text-label cursor-pointer">Ver conteúdo</summary>
                    <div className="mt-3 grid gap-3">
                      {map.mission ? (
                        <div>
                          <p className="text-caption">Missão / finalidade do cargo</p>
                          <p className="whitespace-pre-line">{map.mission}</p>
                        </div>
                      ) : null}
                      {map.responsibilities ? (
                        <div>
                          <p className="text-caption">Responsabilidades</p>
                          <p className="whitespace-pre-line">{map.responsibilities}</p>
                        </div>
                      ) : null}
                      {map.behaviors ? (
                        <div>
                          <p className="text-caption">Comportamentos desejados</p>
                          <p className="whitespace-pre-line">{map.behaviors}</p>
                        </div>
                      ) : null}
                    </div>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isLoading ? (
        <MapForm
          key={`${current?.id ?? 'sem-versao'}-${active.map((item) => item.id).join(',')}`}
          initialMission={current?.mission ?? ''}
          initialBehaviors={current?.behaviors ?? ''}
          initialResponsibilities={
            active.length > 0 ? fieldsFrom(active.map((item) => item.text)) : emptyFields()
          }
          isSaving={isSaving}
          saveError={saveError}
          onSave={onSave}
          onExtract={onExtract}
        />
      ) : null}
    </section>
  );
}
