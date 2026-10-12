import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { startAnalysis } from '@/features/analysis-review';
import { useDirectReport } from '@/features/direct-reports';
import { NewSessionForm, useCreateSession } from '@/features/sessions';

const todayInSaoPaulo = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

export function NewSessionPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const report = useDirectReport(id);
  const create = useCreateSession(id);
  const [isStarting, setIsStarting] = useState(false);

  // Salvar o encontro já pede a análise. Se a IA não estiver disponível, o encontro fica salvo
  // e a página dele mostra o motivo, com o botão Analisar para tentar de novo.
  const handleCreated = async (sessionId: string) => {
    setIsStarting(true);
    let analysisError: string | undefined;
    try {
      await startAnalysis(sessionId);
    } catch (error) {
      analysisError =
        error instanceof Error ? error.message : 'Não foi possível iniciar a análise.';
    }
    void navigate(`/encontros/${sessionId}`, { state: { analysisError } });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-body-sm">
        <Link to={`/pessoas/${id}`} className="text-primary underline underline-offset-4">
          {report.data?.name ?? 'Voltar'}
        </Link>
      </p>
      <h1 className="mt-3">Novo encontro</h1>
      <p className="text-text-muted mt-2">
        Envie a transcrição da conversa. Ao salvar, a IA analisa o encontro e já guarda os
        combinados para a próxima conversa.
      </p>
      <div className="mt-8">
        <NewSessionForm
          initialDate={todayInSaoPaulo()}
          isSubmitting={create.isPending || isStarting}
          errorMessage={create.error?.message}
          onSubmit={(input) =>
            create.mutate(input, { onSuccess: (created) => void handleCreated(created.id) })
          }
          onCancel={() => void navigate(`/pessoas/${id}`)}
        />
      </div>
    </div>
  );
}
