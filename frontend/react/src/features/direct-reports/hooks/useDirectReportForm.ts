import { useState, type FormEvent } from 'react';
import { filledTexts, rulesMessage } from '@/features/responsibilities';
import { behaviorsError, type DirectReportInput } from '../types';

type FieldErrors = Partial<
  Record<'name' | 'role' | 'startedAt' | 'responsibilities' | 'behaviors', string>
>;

const REQUIRED_MESSAGE = 'Preencha este campo.';

const validate = (values: DirectReportInput): FieldErrors => {
  const errors: FieldErrors = {};
  if (values.name.trim().length === 0) errors.name = REQUIRED_MESSAGE;
  if (values.role.trim().length === 0) errors.role = REQUIRED_MESSAGE;
  if (values.startedAt.length === 0) errors.startedAt = REQUIRED_MESSAGE;
  // No cadastro (quando há campos de responsabilidade), o mínimo de 3 é obrigatório.
  if (values.responsibilities) {
    const message = rulesMessage(values.responsibilities);
    if (message) errors.responsibilities = message;
  }
  const behaviors = behaviorsError(values.behaviors ?? '');
  if (behaviors) errors.behaviors = behaviors;
  return errors;
};

export function useDirectReportForm(
  initial: DirectReportInput,
  onSubmit: (values: DirectReportInput) => void,
) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  const setField = <K extends keyof DirectReportInput>(field: K, value: DirectReportInput[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      onSubmit({
        ...values,
        name: values.name.trim(),
        role: values.role.trim(),
        ...(values.behaviors !== undefined ? { behaviors: values.behaviors.trim() } : {}),
        ...(values.responsibilities
          ? { responsibilities: filledTexts(values.responsibilities) }
          : {}),
      });
    }
  };

  return { values, errors, setField, handleSubmit };
}
