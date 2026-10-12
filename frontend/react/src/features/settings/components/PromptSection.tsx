import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { useResetPrompt, useSavePrompt } from '../hooks/useSettings';
import type { Settings } from '../types';
import { SettingsSection } from './SettingsSection';

type PromptSectionProps = { prompt: Settings['prompt'] };

export function PromptSection({ prompt }: PromptSectionProps) {
  const save = useSavePrompt();
  const reset = useResetPrompt();
  // `null` = sem edição em andamento: o campo mostra o que está salvo.
  const [draft, setDraft] = useState<string | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const text = draft ?? prompt.text;
  const length = text.trim().length;
  const isChanged = draft !== null && draft.trim() !== prompt.text.trim();
  const isOutOfRange = length < prompt.minChars || length > prompt.maxChars;

  return (
    <SettingsSection
      title="Prompt da análise"
      description="As instruções que a IA segue ao analisar um encontro. O formato da resposta é fixo e não depende deste texto; mudar as instruções pode alterar a qualidade da análise. Você pode voltar ao padrão a qualquer momento."
    >
      <div className="mb-3 flex items-center gap-3">
        <StatusBadge tone={prompt.isCustom ? 'attention' : 'neutral'}>
          {prompt.isCustom ? 'Personalizado' : 'Padrão'}
        </StatusBadge>
      </div>

      <TextAreaField
        label="Texto do prompt"
        rows={14}
        value={text}
        spellCheck={false}
        onChange={(event) => setDraft(event.target.value)}
        className="max-w-3xl"
      />
      <p className="text-caption mt-1">
        {length.toLocaleString('pt-BR')} de {prompt.maxChars.toLocaleString('pt-BR')} caracteres
        (mínimo {prompt.minChars})
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          onClick={() => save.mutate(text, { onSuccess: () => setDraft(null) })}
          disabled={!isChanged || isOutOfRange || save.isPending}
        >
          {save.isPending ? 'Salvando…' : 'Salvar prompt'}
        </Button>
        {isChanged ? (
          <Button variant="ghost" onClick={() => setDraft(null)}>
            Descartar alterações
          </Button>
        ) : null}
        {prompt.isCustom ? (
          <Button variant="secondary" onClick={() => setIsConfirmingReset(true)}>
            Voltar ao padrão
          </Button>
        ) : null}
      </div>

      {isChanged && isOutOfRange ? (
        <p role="alert" className="text-danger text-body-sm mt-3">
          O prompt precisa ter entre {prompt.minChars.toLocaleString('pt-BR')} e{' '}
          {prompt.maxChars.toLocaleString('pt-BR')} caracteres.
        </p>
      ) : null}
      {save.error ? (
        <p role="alert" className="text-danger text-body-sm mt-3">
          {save.error.message}
        </p>
      ) : null}
      {save.isSuccess && !save.error && draft === null ? (
        <p role="status" className="text-success text-body-sm mt-3">
          Prompt salvo. Vale para as próximas análises.
        </p>
      ) : null}

      <ConfirmDialog
        isOpen={isConfirmingReset}
        title="Voltar ao prompt padrão?"
        description="O texto personalizado será descartado e as próximas análises usarão o prompt padrão do Bonsai."
        confirmLabel="Voltar ao padrão"
        cancelLabel="Cancelar"
        isBusy={reset.isPending}
        errorMessage={reset.error?.message}
        onConfirm={() =>
          reset.mutate(undefined, {
            onSuccess: () => {
              setDraft(null);
              setIsConfirmingReset(false);
            },
          })
        }
        onCancel={() => setIsConfirmingReset(false)}
      />
    </SettingsSection>
  );
}
