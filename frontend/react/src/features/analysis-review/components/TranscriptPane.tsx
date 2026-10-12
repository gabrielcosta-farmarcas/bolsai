import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/cn';
import { highlightTranscript, type Evidence } from '../lib/highlight';

type TranscriptPaneProps = {
  transcript: string;
  // Trechos que a IA citou como origem de combinados; ficam marcados na conversa.
  evidence: Evidence[];
  // Chave do trecho em destaque (o combinado sob o mouse ou o foco).
  activeKey?: string;
};

export function TranscriptPane({ transcript, evidence, activeKey }: TranscriptPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => highlightTranscript(transcript, evidence), [transcript, evidence]);

  useEffect(() => {
    if (!activeKey) return;
    const target = containerRef.current?.querySelector(
      `[data-evidence="${CSS.escape(activeKey)}"]`,
    );
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    target?.scrollIntoView?.({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeKey]);

  return (
    <section aria-labelledby="transcricao" className="flex min-h-0 flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-6 pt-4 md:px-8">
        <h2 id="transcricao" className="text-h3">
          Transcrição
        </h2>
        <p className="text-caption">
          <mark className="bg-accent-subtle text-text border-accent rounded-sm border-b-2 px-0.5">
            Trecho
          </mark>{' '}
          = de onde a IA tirou um combinado
        </p>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto px-6 pt-4 pb-6 md:px-8">
        <div
          tabIndex={0}
          className="bg-surface border-border text-body-lg grid gap-3 rounded-lg border p-6"
        >
          {lines.map((line, index) => (
            <p key={index}>
              {line.speaker ? <strong className="font-semibold">{line.speaker} </strong> : null}
              {line.segments.map((segment, position) =>
                segment.key ? (
                  <mark
                    key={position}
                    data-evidence={segment.key}
                    className={cn(
                      'bg-accent-subtle text-text border-accent rounded-sm border-b-2 px-0.5',
                      segment.key === activeKey && 'outline-accent outline-3 outline-offset-1',
                    )}
                  >
                    {segment.text}
                  </mark>
                ) : (
                  <span key={position}>{segment.text}</span>
                ),
              )}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
