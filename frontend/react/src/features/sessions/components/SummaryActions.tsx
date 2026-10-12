import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useSessionSummary } from '../hooks/useSessions';

type SummaryActionsProps = { sessionId: string };

type Feedback = { tone: 'success' | 'error'; text: string };

const download = (fileName: string, markdown: string) => {
  const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

// Copiar o resumo (resumo, temas e combinados) para colar em um e-mail, ou baixar como .md.
// O texto vem pronto do servidor: a transcrição e as notas privadas não fazem parte dele.
export function SummaryActions({ sessionId }: SummaryActionsProps) {
  const summary = useSessionSummary(sessionId);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const run = (action: 'copy' | 'download') =>
    summary.mutate(undefined, {
      onSuccess: async ({ markdown, fileName }) => {
        if (action === 'download') {
          download(fileName, markdown);
          setFeedback({ tone: 'success', text: 'Arquivo baixado.' });
          return;
        }
        try {
          await navigator.clipboard.writeText(markdown);
          setFeedback({ tone: 'success', text: 'Resumo copiado. É só colar no e-mail.' });
        } catch {
          setFeedback({
            tone: 'error',
            text: 'Não deu para copiar. Use Baixar .md e abra o arquivo.',
          });
        }
      },
      onError: (error) => setFeedback({ tone: 'error', text: error.message }),
    });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => run('copy')}
        disabled={summary.isPending}
      >
        Copiar resumo
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => run('download')}
        disabled={summary.isPending}
      >
        Baixar .md
      </Button>
      {feedback ? (
        <span
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          className={
            feedback.tone === 'error' ? 'text-danger text-caption' : 'text-success text-caption'
          }
        >
          {feedback.text}
        </span>
      ) : null}
    </div>
  );
}
