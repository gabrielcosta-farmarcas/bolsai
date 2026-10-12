import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { NotFoundError } from '../errors/not-found-error.js';

// backend/node/prompts, tanto em src/shared/ai (dev) quanto em dist/shared/ai (produção).
const DEFAULT_PROMPTS_DIR = fileURLToPath(new URL('../../../prompts/', import.meta.url));

// Cada prompt é um único arquivo `<nome>.md`, versionado no Git junto com o código.
export const loadPrompt = async (
  name: string,
  dir: string = DEFAULT_PROMPTS_DIR,
): Promise<string> => {
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new NotFoundError('Prompt inválido', 'PROMPT_NOT_FOUND');
  }
  try {
    return await readFile(`${dir}${name}.md`, 'utf8');
  } catch {
    throw new NotFoundError(`Prompt ${name} não encontrado`, 'PROMPT_NOT_FOUND');
  }
};
