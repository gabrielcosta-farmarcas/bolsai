import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { cn } from '@/lib/cn';
import { formatCalendarDate } from '@/lib/format';
import type { Agreement, AgreementOwner, AgreementPatch, AgreementStatus } from '../types';

const OWNER_OPTIONS = [
  { value: 'leader', label: 'Você' },
  { value: 'report', label: 'A pessoa' },
] as const;

const STATUS_OPTIONS = [
  { value: 'open', label: 'Em aberto' },
  { value: 'done', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
] as const;

type AgreementItemProps = {
  agreement: Agreement;
  // Mostra quem é a pessoa do combinado (visão geral).
  showPerson?: boolean;
  isSaving: boolean;
  errorMessage?: string;
  onChange: (patch: AgreementPatch) => void;
};

function StatusMarks({ agreement }: { agreement: Agreement }) {
  return (
    <>
      {agreement.status === 'done' ? <StatusBadge tone="growth">Concluído</StatusBadge> : null}
      {agreement.status === 'cancelled' ? <StatusBadge>Cancelado</StatusBadge> : null}
      {agreement.isOverdue ? <StatusBadge tone="attention">Atrasado</StatusBadge> : null}
      {agreement.origin === 'ai' && !agreement.isConfirmed ? (
        <StatusBadge tone="agreement">Da IA, ainda não revisado</StatusBadge>
      ) : null}
    </>
  );
}

export function AgreementItem({
  agreement,
  showPerson = false,
  isSaving,
  errorMessage,
  onChange,
}: AgreementItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(agreement.description);
  const [owner, setOwner] = useState<AgreementOwner>(agreement.owner);
  const [dueDate, setDueDate] = useState(agreement.dueDate ?? '');
  const [status, setStatus] = useState<AgreementStatus>(agreement.status);

  const isOpen = agreement.status === 'open';
  const ownerLabel = agreement.owner === 'leader' ? 'Você' : 'A pessoa';

  const handleSave = () => {
    if (description.trim().length === 0) return;
    onChange({ description: description.trim(), owner, dueDate: dueDate || null, status });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <li className="bg-primary-subtle grid gap-4 px-5 py-5">
        <TextAreaField
          label="Combinado"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Responsável"
            value={owner}
            options={OWNER_OPTIONS}
            onChange={(event) => setOwner(event.target.value as AgreementOwner)}
          />
          <TextField
            label="Prazo"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
          <SelectField
            label="Situação"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(event) => setStatus(event.target.value as AgreementStatus)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving || description.trim().length === 0}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        'grid items-start gap-x-6 gap-y-3 px-5 py-4',
        showPerson
          ? 'lg:grid-cols-[14rem_minmax(0,1fr)_15rem_auto]'
          : 'lg:grid-cols-[minmax(0,1fr)_15rem_auto]',
      )}
    >
      {showPerson ? (
        <Link
          to={`/pessoas/${agreement.directReportId}`}
          className="flex items-center gap-3 self-start"
        >
          <Avatar name={agreement.directReportName} className="text-caption size-8" />
          <span className="text-label">{agreement.directReportName}</span>
        </Link>
      ) : null}
      <div className="grid gap-1">
        <p
          className={
            agreement.status === 'cancelled' ? 'text-text-muted line-through' : 'text-text'
          }
        >
          {agreement.description}
        </p>
        {agreement.evidenceExcerpt ? (
          <p className="text-caption">Na conversa: “{agreement.evidenceExcerpt}”</p>
        ) : null}
        {errorMessage ? (
          <p role="alert" className="text-danger text-body-sm">
            {errorMessage}
          </p>
        ) : null}
      </div>
      <div className="grid content-start gap-2">
        <p className="text-caption">
          {ownerLabel}
          {agreement.dueDate ? ` · até ${formatCalendarDate(agreement.dueDate)}` : ' · sem prazo'}
        </p>
        <div className="flex flex-wrap gap-2 empty:hidden">
          <StatusMarks agreement={agreement} />
        </div>
      </div>
      <div className="flex gap-2">
        {isOpen ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={isSaving}
            onClick={() => onChange({ status: 'done' })}
          >
            Concluir
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={isSaving}
            onClick={() => onChange({ status: 'open' })}
          >
            Reabrir
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
          Editar
        </Button>
      </div>
    </li>
  );
}
