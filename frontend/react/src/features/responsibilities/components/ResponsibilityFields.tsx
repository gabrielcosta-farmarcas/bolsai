import { TextAreaField } from '@/components/ui/TextAreaField';
import { FIELD_COUNT, MIN_RESPONSIBILITIES, countFilled, duplicateCount } from '../lib/rules';

type ResponsibilityFieldsProps = {
  // Sempre 10 valores, um por campo (vazio = não usado).
  values: string[];
  onChange: (values: string[]) => void;
  errorMessage?: string;
};

// Um campo de texto para cada responsabilidade do cargo. Cada campo preenchido vira uma responsabilidade.
export function ResponsibilityFields({
  values,
  onChange,
  errorMessage,
}: ResponsibilityFieldsProps) {
  const filled = countFilled(values);
  const duplicates = duplicateCount(values);

  const setValue = (index: number, value: string) => {
    onChange(values.map((current, position) => (position === index ? value : current)));
  };

  return (
    <fieldset className="grid gap-4">
      <legend className="text-h3 pr-3">Responsabilidades</legend>
      <p className="text-text-muted">
        Escreva uma responsabilidade do cargo em cada campo. Preencha pelo menos{' '}
        {MIN_RESPONSIBILITIES} (até {FIELD_COUNT}). A IA usa todas elas para ligar a evolução da
        pessoa ao cargo.
      </p>
      <p role="status" className="text-caption">
        {filled === 1 ? '1 preenchida' : `${filled} preenchidas`} · mínimo {MIN_RESPONSIBILITIES}
      </p>
      {values.map((value, index) => (
        <TextAreaField
          // O número do campo é fixo; o texto é que muda.
          key={index}
          label={`Responsabilidade ${index + 1}`}
          rows={2}
          value={value}
          onChange={(event) => setValue(index, event.target.value)}
        />
      ))}
      {duplicates > 0 ? (
        <p className="text-body-sm text-text-muted">
          {duplicates === 1
            ? 'Há 1 responsabilidade repetida: ela será juntada com a outra.'
            : `Há ${duplicates} responsabilidades repetidas: elas serão juntadas.`}
        </p>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="text-danger text-body-sm">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}
