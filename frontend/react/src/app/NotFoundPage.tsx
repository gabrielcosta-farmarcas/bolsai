import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="max-w-reading">
      <h1>Página não encontrada</h1>
      <p className="text-text-muted mt-3">O endereço não existe no Bonsai.</p>
      <Link to="/" className="text-primary mt-6 inline-block underline underline-offset-4">
        Voltar ao início
      </Link>
    </div>
  );
}
