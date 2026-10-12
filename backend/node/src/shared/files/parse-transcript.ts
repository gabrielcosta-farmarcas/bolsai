import { AppError } from '../errors/app-error.js';
import { extractText, MAX_UPLOAD_BYTES } from './extract-text.js';

const EXTENSIONS = ['txt', 'vtt', 'srt', 'docx'] as const;
type TranscriptExtension = (typeof EXTENSIONS)[number];

const TIMING_LINE = /-->/;
const BLOCKS_TO_DROP = /^(WEBVTT|NOTE|STYLE|REGION)/;

const extensionOf = (fileName: string) => fileName.split('.').at(-1)?.toLowerCase() ?? '';

const isSupported = (extension: string): extension is TranscriptExtension =>
  (EXTENSIONS as readonly string[]).includes(extension);

// <v Ana>texto</v> vira "Ana: texto"; demais marcações (<c>, <i>, <b>) são removidas.
const cleanCueText = (line: string) =>
  line
    .replace(/<v(?:\.[^\s>]+)?\s+([^>]+)>/g, '$1: ')
    .replace(/<\/?[^>]+>/g, '')
    .trim();

// VTT e SRT compartilham a estrutura: blocos separados por linha em branco, com uma linha de
// tempo ("00:00 --> 00:05") e as falas depois dela. Identificadores de bloco são descartados.
const parseCues = (raw: string): string => {
  const blocks = raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/);

  const lines: string[] = [];
  for (const block of blocks) {
    const blockLines = block.split('\n');
    if (BLOCKS_TO_DROP.test(blockLines[0]?.trim() ?? '')) continue;

    const timingIndex = blockLines.findIndex((line) => TIMING_LINE.test(line));
    if (timingIndex === -1) continue;

    const text = blockLines
      .slice(timingIndex + 1)
      .map(cleanCueText)
      .filter((line) => line.length > 0)
      .join(' ');
    if (text.length > 0) lines.push(text);
  }
  return lines.join('\n');
};

export async function parseTranscript(buffer: Buffer, fileName: string): Promise<string> {
  const extension = extensionOf(fileName);
  if (!isSupported(extension)) {
    throw new AppError('Envie um arquivo .txt, .vtt, .srt ou .docx.', 415, 'UNSUPPORTED_FILE_TYPE');
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new AppError('O arquivo passa do limite de 10 MB.', 413, 'FILE_TOO_LARGE');
  }

  const text =
    extension === 'vtt' || extension === 'srt'
      ? parseCues(buffer.toString('utf8'))
      : (await extractText(buffer, fileName)).text.replace(/^\uFEFF/, '');

  if (text.trim().length === 0) {
    throw new AppError('O arquivo não tem texto legível.', 422, 'UNREADABLE_FILE');
  }
  return text.trim();
}
