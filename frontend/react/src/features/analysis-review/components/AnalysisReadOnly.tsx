import type { AnalysisContent, ResponsibilityOption } from '../types';

type AnalysisReadOnlyProps = {
  content: AnalysisContent;
  // Para mostrar o título da responsabilidade de cada sinal.
  responsibilities?: ResponsibilityOption[];
};

const signalLabel = (id: string | null, responsibilities: ResponsibilityOption[]) =>
  id === null
    ? 'Fora das responsabilidades'
    : (responsibilities.find((item) => item.id === id)?.title ?? 'Responsabilidade removida');

const OWNER_LABEL = { leader: 'Você', report: 'A pessoa' } as const;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2">{title}</h3>
      {children}
    </section>
  );
}

// Versão só de leitura, usada na comparação lado a lado.
export function AnalysisReadOnly({ content, responsibilities = [] }: AnalysisReadOnlyProps) {
  return (
    <div className="text-body">
      <Block title="Resumo">
        <p className="whitespace-pre-line">{content.summary}</p>
      </Block>
      <Block title="Temas">
        <ul className="list-disc pl-5">
          {content.themes.map((theme, index) => (
            <li key={index}>
              <strong>{theme.title}.</strong> {theme.detail}
            </li>
          ))}
        </ul>
      </Block>
      <Block title="Combinados">
        {content.agreements.length === 0 ? (
          <p className="text-text-muted">Nenhum.</p>
        ) : (
          <ul className="list-disc pl-5">
            {content.agreements.map((agreement, index) => (
              <li key={index}>
                {agreement.description} ({OWNER_LABEL[agreement.owner]},{' '}
                {agreement.due_date ?? 'sem prazo'})
              </li>
            ))}
          </ul>
        )}
      </Block>
      <Block title="Sinais de evolução">
        {content.development_signals.length === 0 ? (
          <p className="text-text-muted">Nenhum.</p>
        ) : (
          <ul className="list-disc pl-5">
            {content.development_signals.map((signal, index) => (
              <li key={index}>
                <strong>{signalLabel(signal.responsibility_id, responsibilities)}:</strong>{' '}
                {signal.observation}
              </li>
            ))}
          </ul>
        )}
      </Block>
      <Block title="Perguntas para o próximo encontro">
        <ul className="list-disc pl-5">
          {content.next_questions.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ul>
      </Block>
    </div>
  );
}
