import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { NotFoundError } from '../errors/not-found-error.js';
import { makeFakeAiClient } from './fake-ai-client.js';
import { loadPrompt } from './prompt-loader.js';

const request = { system: 's', user: 'u', outputSchema: z.object({}) };

describe('FakeAiClient', () => {
  it('deve devolver as respostas na ordem, como texto JSON, e registrar as chamadas', async () => {
    const { client, calls } = makeFakeAiClient([{ a: 1 }, 'texto cru', new Error('rede caiu')]);

    expect((await client.generateStructured(request)).text).toBe('{"a":1}');
    expect((await client.generateStructured(request)).text).toBe('texto cru');
    await expect(client.generateStructured(request)).rejects.toThrow('rede caiu');
    expect(calls).toHaveLength(3);
    await expect(client.generateStructured(request)).rejects.toThrow('sem resposta');
  });
});

describe('prompt loader', () => {
  const makeDir = async () => {
    const dir = `${await mkdtemp(join(tmpdir(), 'prompts-'))}/`;
    await writeFile(`${dir}analysis-1on1.md`, 'prompt único');
    return dir;
  };

  it('deve carregar o arquivo do prompt', async () => {
    expect(await loadPrompt('analysis-1on1', await makeDir())).toBe('prompt único');
  });

  it('deve recusar prompt inexistente ou com caminho suspeito', async () => {
    const dir = await makeDir();

    await expect(loadPrompt('outro-prompt', dir)).rejects.toBeInstanceOf(NotFoundError);
    await expect(loadPrompt('../segredo', dir)).rejects.toBeInstanceOf(NotFoundError);
  });
});
