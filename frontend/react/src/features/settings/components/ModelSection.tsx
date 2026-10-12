import { SelectField } from '@/components/ui/SelectField';
import { useSaveModel } from '../hooks/useSettings';
import type { Settings } from '../types';
import { SettingsSection } from './SettingsSection';

type ModelSectionProps = { model: Settings['model'] };

export function ModelSection({ model }: ModelSectionProps) {
  const save = useSaveModel();
  const known = model.options.find((option) => option.id === model.value);
  // O padrão da instalação pode ser um modelo fora da lista: aparece como está, sem poder ser escolhido de novo.
  const unknownCurrent = model.value && !known ? model.value : null;

  const options = [
    ...(model.value === null ? [{ value: '', label: 'Escolha um modelo' }] : []),
    ...(unknownCurrent
      ? [{ value: unknownCurrent, label: `${unknownCurrent} (padrão da instalação)` }]
      : []),
    ...model.options.map((option) => ({ value: option.id, label: option.label })),
  ];

  return (
    <SettingsSection
      title="Modelo"
      description="Qual modelo do Claude faz as análises e sugere os títulos. Vale para as próximas análises; as que já foram feitas não mudam."
    >
      <SelectField
        label="Modelo usado"
        value={model.value ?? ''}
        options={options}
        disabled={save.isPending}
        className="max-w-sm"
        onChange={(event) => {
          if (event.target.value && event.target.value !== model.value) {
            save.mutate(event.target.value);
          }
        }}
      />
      {known ? <p className="text-text-muted text-body-sm mt-2">{known.description}</p> : null}
      {model.source === 'installation' && known ? (
        <p className="text-text-muted text-body-sm mt-1">Este é o modelo padrão da instalação.</p>
      ) : null}
      {save.error ? (
        <p role="alert" className="text-danger text-body-sm mt-3">
          {save.error.message}
        </p>
      ) : null}
      {save.isSuccess && !save.error ? (
        <p role="status" className="text-success text-body-sm mt-3">
          Modelo salvo.
        </p>
      ) : null}
    </SettingsSection>
  );
}
