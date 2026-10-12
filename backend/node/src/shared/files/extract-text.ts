import mammoth from 'mammoth';
import { extractText as extractPdfText, getDocumentProxy } from 'unpdf';
import { AppError } from '../errors/app-error.js';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type FileKind = 'pdf' | 'docx' | 'text';
export type ExtractedText = { text: string; fileType: FileKind };

const KIND_BY_EXTENSION: Record<string, FileKind> = {
  pdf: 'pdf',
  docx: 'docx',
  txt: 'text',
};

const extensionOf = (fileName: string) => fileName.split('.').at(-1)?.toLowerCase() ?? '';

const readers: Record<FileKind, (buffer: Buffer) => Promise<string>> = {
  text: async (buffer) => buffer.toString('utf8'),
  docx: async (buffer) => (await mammoth.extractRawText({ buffer })).value,
  pdf: async (buffer) => {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractPdfText(pdf, { mergePages: true });
    return text;
  },
};

export async function extractText(buffer: Buffer, fileName: string): Promise<ExtractedText> {
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new AppError('O arquivo passa do limite de 10 MB.', 413, 'FILE_TOO_LARGE');
  }

  const fileType = KIND_BY_EXTENSION[extensionOf(fileName)];
  if (!fileType) {
    throw new AppError('Envie um arquivo PDF, DOCX ou TXT.', 415, 'UNSUPPORTED_FILE_TYPE');
  }

  let text: string;
  try {
    text = (await readers[fileType](buffer)).trim();
  } catch {
    throw new AppError('Não foi possível ler o arquivo.', 422, 'UNREADABLE_FILE');
  }

  if (text.length === 0) {
    throw new AppError(
      'O arquivo não tem texto legível. Se for um PDF escaneado, cole o texto ou envie outro formato.',
      422,
      'UNREADABLE_FILE',
    );
  }

  return { text, fileType };
}
