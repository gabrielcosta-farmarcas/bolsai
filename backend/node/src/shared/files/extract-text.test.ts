import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/app-error.js';
import { extractText, MAX_UPLOAD_BYTES } from './extract-text.js';

const fixture = (name: string) => readFile(new URL(`./__fixtures__/${name}`, import.meta.url));

describe('extractText', () => {
  it('deve ler arquivo de texto em UTF-8 e informar o tipo text', async () => {
    const result = await extractText(Buffer.from('Gestão de pessoas', 'utf8'), 'mapa.txt');

    expect(result).toEqual({ text: 'Gestão de pessoas', fileType: 'text' });
  });

  it('deve ler .docx', async () => {
    const result = await extractText(await fixture('exemplo.docx'), 'mapa.docx');

    expect(result.fileType).toBe('docx');
    expect(result.text).toContain('Gestão de pessoas e comunicação');
    expect(result.text).toContain('Entregas com qualidade');
  });

  it('deve ler PDF com texto', async () => {
    const result = await extractText(await fixture('com-texto.pdf'), 'mapa.pdf');

    expect(result.fileType).toBe('pdf');
    expect(result.text).toContain('Responsabilidades da pessoa liderada');
  });

  it('deve recusar PDF sem texto legível (escaneado)', async () => {
    await expect(extractText(await fixture('sem-texto.pdf'), 'scan.pdf')).rejects.toMatchObject({
      code: 'UNREADABLE_FILE',
      statusCode: 422,
    });
  });

  it('deve recusar tipo de arquivo não suportado', async () => {
    await expect(extractText(Buffer.from('x'), 'mapa.xlsx')).rejects.toMatchObject({
      code: 'UNSUPPORTED_FILE_TYPE',
      statusCode: 415,
    });
  });

  it('deve recusar arquivo acima de 10 MB', async () => {
    const big = Buffer.alloc(MAX_UPLOAD_BYTES + 1);

    const error = await extractText(big, 'mapa.txt').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'FILE_TOO_LARGE', statusCode: 413 });
  });

  it('deve recusar texto vazio', async () => {
    await expect(extractText(Buffer.from('   \n'), 'mapa.txt')).rejects.toMatchObject({
      code: 'UNREADABLE_FILE',
    });
  });
});
