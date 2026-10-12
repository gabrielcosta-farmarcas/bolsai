import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parseTranscript } from './parse-transcript.js';

const buf = (text: string) => Buffer.from(text, 'utf8');

describe('parseTranscript', () => {
  it('deve ler .txt e remover o BOM', async () => {
    expect(await parseTranscript(buf('\uFEFFOlá, tudo bem?\nTudo ótimo.'), 'conversa.txt')).toBe(
      'Olá, tudo bem?\nTudo ótimo.',
    );
  });

  it('deve extrair falas de .vtt mantendo o falante e descartando tempos e metadados', async () => {
    const vtt = [
      'WEBVTT',
      '',
      'NOTE gerado automaticamente',
      '',
      '1',
      '00:00:01.000 --> 00:00:04.000',
      '<v Marina Tavares>Queria falar sobre o projeto novo.</v>',
      '',
      '2',
      '00:00:04.500 --> 00:00:08.000',
      '<v Gestor>Claro, me conta mais.</v>',
    ].join('\n');

    expect(await parseTranscript(buf(vtt), 'reuniao.vtt')).toBe(
      'Marina Tavares: Queria falar sobre o projeto novo.\nGestor: Claro, me conta mais.',
    );
  });

  it('deve extrair falas de .srt unindo linhas da mesma fala', async () => {
    const srt = [
      '1',
      '00:00:01,000 --> 00:00:03,000',
      'Marina: Estou animada com',
      'o novo desafio.',
      '',
      '2',
      '00:00:03,500 --> 00:00:05,000',
      'Gestor: <i>Que bom!</i>',
    ].join('\r\n');

    expect(await parseTranscript(buf(srt), 'reuniao.srt')).toBe(
      'Marina: Estou animada com o novo desafio.\nGestor: Que bom!',
    );
  });

  it('deve ler .docx', async () => {
    const docx = await readFile(new URL('./__fixtures__/exemplo.docx', import.meta.url));

    expect(await parseTranscript(docx, 'conversa.docx')).toContain(
      'Gestão de pessoas e comunicação',
    );
  });

  it('deve recusar tipo não suportado, inclusive PDF', async () => {
    await expect(parseTranscript(buf('x'), 'conversa.pdf')).rejects.toMatchObject({
      code: 'UNSUPPORTED_FILE_TYPE',
    });
  });

  it('deve recusar arquivo sem falas', async () => {
    await expect(parseTranscript(buf('WEBVTT\n\n'), 'vazio.vtt')).rejects.toMatchObject({
      code: 'UNREADABLE_FILE',
    });
  });
});
