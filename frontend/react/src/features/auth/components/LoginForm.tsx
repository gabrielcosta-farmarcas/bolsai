import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

type LoginFormProps = {
  // Recebe o e-mail (já validado) para enviar ao Keycloak como dica; a senha é digitada lá.
  onContinue: (email: string) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (value: string): string | undefined => {
  if (value.length === 0) return 'Informe seu e-mail de trabalho.';
  if (!EMAIL_PATTERN.test(value)) return 'Informe um e-mail válido.';
  return undefined;
};

export function LoginForm({ onContinue }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    const message = validateEmail(trimmed);
    setError(message);
    if (!message) onContinue(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <TextField
        label="E-mail de trabalho"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="voce@empresa.com.br"
        value={email}
        errorMessage={error}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button type="submit" className="w-full">
        Continuar
      </Button>
      <p className="text-caption text-center">
        Na próxima tela você informa a senha e o código do autenticador.
      </p>
    </form>
  );
}
