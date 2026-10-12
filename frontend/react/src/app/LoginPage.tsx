import { Navigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { LOGIN_PATH, LoginForm, useAuth } from '@/features/auth';

const ERROR_MESSAGES: Record<string, string> = {
  falha: 'Não conseguimos concluir sua entrada. Tente de novo.',
  cancelado: 'A entrada foi cancelada. Tente de novo quando quiser.',
  sessao: 'A entrada demorou demais. Tente de novo.',
  indisponivel: 'Não conseguimos entrar agora. Tente de novo em instantes.',
};

export function LoginPage() {
  const { state } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const errorCode = new URLSearchParams(location.search).get('erro');
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] : undefined;

  if (state.status === 'signedIn') return <Navigate to={from} replace />;

  // A senha e o código do autenticador são digitados no Keycloak; aqui só levamos até lá.
  const handleContinue = (email: string) => {
    const query = new URLSearchParams({ hint: email, returnTo: from });
    window.location.assign(`${LOGIN_PATH}?${query.toString()}`);
  };

  return (
    <main className="bg-bg flex min-h-screen items-center justify-center px-4 py-8">
      <div className="bg-surface border-border w-full max-w-[420px] rounded-xl border px-6 py-10 md:px-10">
        <div className="flex flex-col items-center text-center">
          <Logo variant="vertical" size="login" />
          <p className="text-body-lg text-text-muted mt-5">cuidado contínuo, crescimento visível</p>
        </div>
        {errorMessage ? (
          <p
            role="alert"
            className="bg-danger-subtle border-danger text-danger mt-6 rounded-lg border p-3 text-body-sm"
          >
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-8">
          <LoginForm onContinue={handleContinue} />
        </div>
        <p className="text-caption mt-6 text-center">
          Ao entrar, você concorda com os{' '}
          <a
            href="#"
            onClick={(event) => event.preventDefault()}
            className="underline underline-offset-2"
          >
            Termos de uso
          </a>{' '}
          e a{' '}
          <a
            href="#"
            onClick={(event) => event.preventDefault()}
            className="underline underline-offset-2"
          >
            Política de privacidade
          </a>
          .
        </p>
      </div>
    </main>
  );
}
