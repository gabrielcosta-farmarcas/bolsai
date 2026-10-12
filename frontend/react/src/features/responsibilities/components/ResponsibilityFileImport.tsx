import { useId, useState } from 'react';
import type { Proposal } from '../types';

type ResponsibilityFileImportProps = {
  // Lê o arquivo no servidor e devolve a proposta (nada é salvo).
  onExtract: (file: File) => Promise<Proposal>;
  onProposal: (proposal: Proposal) => void;
};

// Preenche os campos a partir de um PDF, DOCX ou TXT. A líder confere e ajusta antes de salvar.
export function ResponsibilityFileImport({ onExtract, onProposal }: ResponsibilityFileImportProps) {
  const id = useId();
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsReading(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const proposal = await onExtract(file);
      onProposal(proposal);
      const left = proposal.leftOut.length;
      setNotice(
        left > 0
          ? `Preenchemos os campos. ${left === 1 ? '1 parágrafo ficou' : `${left} parágrafos ficaram`} de fora (o limite é 10). Confira antes de salvar.`
          : 'Preenchemos os campos. Confira e ajuste antes de salvar.',
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível ler o arquivo.');
    } finally {
      setIsReading(false);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="text-label mb-1 block">
        Preencher a partir de um arquivo (PDF, DOCX ou TXT, até 10 MB)
      </label>
      <input
        id={id}
        type="file"
        accept=".pdf,.docx,.txt"
        disabled={isReading}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
        className="text-body-sm border-border-strong w-full rounded-md border px-3 py-2"
      />
      <p className="text-caption mt-1">
        O arquivo só é lido para preencher os campos: ele não é guardado.
      </p>
      {isReading ? (
        <p role="status" className="text-text-muted text-body-sm mt-2">
          Lendo o arquivo…
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-success text-body-sm mt-2">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-danger text-body-sm mt-2">
          {error}
        </p>
      ) : null}
    </div>
  );
}
