import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TextField } from '@/components/ui/TextField';
import { formatDateTime } from '@/lib/format';
import { useRemoveApiKey, useSaveApiKey } from '../hooks/useSettings';
import type { Settings } from '../types';
import { SettingsSection } from './SettingsSection';

type ApiKeySectionProps = { apiKey: Settings['apiKey'] };

export function ApiKeySection({ apiKey }: ApiKeySectionProps) {
  const save = useSaveApiKey();
  const remove = useRemoveApiKey();
  const [value, setValue] = useState('');
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);

  const status =
    apiKey.source === 'leader'
      ? `Chave cadastrada: •••• ${apiKey.last4 ?? ''}${
          apiKey.updatedAt ? ` (trocada em ${formatDateTime(apiKey.updatedAt)})` : ''
        }`
      : apiKey.source === 'installation'
        ? 'Usando a chave padrão da instalação. Cadastre a sua para trocar.'
        : 'Nenhuma chave cadastrada.';

  const handleSave = () =>
    save.mutate(value, {
      onSuccess: () => setValue(''),
    });

  return (
    <SettingsSection
      title="Chave de API do Claude"
      description="É a chave da sua conta na Anthropic, usada para a IA analisar os encontros. Ela é guardada com segurança e nunca aparece inteira depois de salva."
    >
      <p role="status" className="text-body">
        {status}
      </p>

      <form
        className="mt-4 flex max-w-xl flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) handleSave();
        }}
      >
        <TextField
          label={apiKey.source === 'leader' ? 'Nova chave' : 'Chave'}
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-ant-…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-w-64 flex-1"
        />
        <Button type="submit" disabled={!value.trim() || save.isPending}>
          {save.isPending ? 'Conferindo…' : 'Salvar chave'}
        </Button>
        {apiKey.source === 'leader' ? (
          <Button type="button" variant="secondary" onClick={() => setIsConfirmingRemoval(true)}>
            Remover
          </Button>
        ) : null}
      </form>

      {save.error ? (
        <p role="alert" className="text-danger text-body-sm mt-3">
          {save.error.message}
        </p>
      ) : null}
      {save.isSuccess && !save.error ? (
        <p role="status" className="text-success text-body-sm mt-3">
          Chave conferida e salva.
        </p>
      ) : null}

      <ConfirmDialog
        isOpen={isConfirmingRemoval}
        title="Remover a chave?"
        description="A análise deixa de funcionar até você cadastrar uma chave de novo (ou usa a chave padrão da instalação, se houver)."
        confirmLabel="Remover chave"
        cancelLabel="Cancelar"
        isBusy={remove.isPending}
        errorMessage={remove.error?.message}
        onConfirm={() =>
          remove.mutate(undefined, { onSuccess: () => setIsConfirmingRemoval(false) })
        }
        onCancel={() => setIsConfirmingRemoval(false)}
      />
    </SettingsSection>
  );
}
