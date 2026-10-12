import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { loggerOptions } from './logger.js';

const capture = () => {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(String(chunk));
      callback();
    },
  });
  return { lines, logger: pino({ ...loggerOptions, level: 'info' }, stream) };
};

describe('logger', () => {
  it('não deve registrar trechos de transcrição nem de análise', () => {
    const { lines, logger } = capture();

    logger.info({ transcript: 'SEGREDO-TRANSCRICAO', sessionId: 's1' }, 'sessão criada');
    logger.info({ analysis: { summary: 'SEGREDO-RESUMO' }, rawJson: 'SEGREDO-JSON' }, 'ok');
    logger.info({ data: { private_leader_notes: 'SEGREDO-NOTAS' } }, 'ok');

    const output = lines.join('');
    expect(output).not.toContain('SEGREDO');
    expect(output).toContain('s1');
  });

  it('não deve registrar a chave de API nem o prompt da líder', () => {
    const { lines, logger } = capture();

    logger.info({ body: { apiKey: 'SEGREDO-CHAVE' }, apiKey: 'SEGREDO-CHAVE-2' }, 'ok');
    logger.info(
      {
        data: { analysisPrompt: 'SEGREDO-PROMPT' },
        req: { headers: { 'x-api-key': 'SEGREDO-HEADER' } },
      },
      'ok',
    );

    expect(lines.join('')).not.toContain('SEGREDO');
  });

  it('não deve registrar credenciais de login', () => {
    const { lines, logger } = capture();

    logger.info(
      {
        req: {
          headers: { authorization: 'Bearer SEGREDO-TOKEN', cookie: 'bonsai_sid=SEGREDO-COOKIE' },
        },
        res: { headers: { 'set-cookie': ['bonsai_sid=SEGREDO-SET'] } },
        refreshToken: 'SEGREDO-REFRESH',
        data: { id_token: 'SEGREDO-ID', state: 'SEGREDO-STATE' },
      },
      'pedido',
    );

    expect(lines.join('')).not.toContain('SEGREDO');
  });
});
