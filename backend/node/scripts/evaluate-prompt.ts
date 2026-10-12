// Avalia o prompt de análise contra as conversas fictícias de fixtures/.
// Usa a API real da Anthropic (gasta tokens): por isso não roda na CI.
//   docker compose exec api npm run evaluate -- [--fixture 01-projeto-novo] [--mostrar]
// --mostrar imprime o resumo e o feedback do líder de cada conversa.
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { analysisOutputSchema } from '../src/modules/analyses/analysis.schema.js';
import { buildAnalysisInput } from '../src/modules/analyses/analysis-input.js';
import {
  evaluateAnalysis,
  fixtureSchema,
  MAX_SUMMARY_CHARS,
} from '../src/modules/analyses/evaluation.js';
import { makeAnthropicClient } from '../src/shared/ai/anthropic-client.js';
import { loadPrompt } from '../src/shared/ai/prompt-loader.js';

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures/', import.meta.url));
const PROMPT_NAME = 'analysis-1on1';

const argValue = (flag: string) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
};

const print = (line = '') => process.stdout.write(`${line}\n`);

const main = async () => {
  const only = argValue('--fixture');
  const system = await loadPrompt(PROMPT_NAME);
  const ai = makeAnthropicClient();

  const names = (await readdir(FIXTURES_DIR))
    .filter((file) => file.endsWith('.transcript.txt'))
    .map((file) => file.replace('.transcript.txt', ''))
    .filter((name) => !only || name === only)
    .sort();

  print(`Prompt ${PROMPT_NAME}`);
  let passedCount = 0;

  for (const name of names) {
    const transcript = (await readFile(`${FIXTURES_DIR}${name}.transcript.txt`, 'utf8')).trim();
    const fixture = fixtureSchema.parse(
      JSON.parse(await readFile(`${FIXTURES_DIR}${name}.expected.json`, 'utf8')),
    );

    const response = await ai.generateStructured({
      system,
      user: buildAnalysisInput({
        heldOn: fixture.heldOn,
        transcript,
        map: {
          version: 1,
          mission: fixture.mission,
          responsibilities: fixture.responsibilities.map((text, index) => ({
            ref: `R${index + 1}`,
            text,
          })),
        },
        history: fixture.history,
        openAgreements: fixture.openAgreements,
      }),
      outputSchema: analysisOutputSchema,
    });

    const parsed = analysisOutputSchema.safeParse(JSON.parse(response.text));
    if (!parsed.success) {
      const reasons = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'raiz'}: ${issue.message}`)
        .join('; ');
      print(`✗ ${name}: saída fora do formato (${reasons})`);
      continue;
    }

    const result = evaluateAnalysis(parsed.data, fixture, transcript);
    if (process.argv.includes('--mostrar')) {
      print(`\n[${name}] RESUMO:\n${parsed.data.summary}`);
      print(
        `FEEDBACK DO LÍDER (${parsed.data.leader_feedback.overall}): ${parsed.data.leader_feedback.overall_note}`,
      );
      for (const item of parsed.data.development_signals) {
        print(`  [${item.responsibility_ref}] (${item.kind}) ${item.observation}`);
      }
      for (const item of parsed.data.leader_feedback.strengths) print(`  + ${item.point}`);
      for (const item of parsed.data.leader_feedback.opportunities) {
        print(`  - ${item.point} → ${item.suggestion}`);
      }
      print();
    }
    if (result.passed) passedCount += 1;
    print(
      `${result.passed ? '✓' : '✗'} ${name} (${response.inputTokens} + ${response.outputTokens} tokens)`,
    );
    for (const [label, items] of Object.entries({
      faltou: result.missingAgreements,
      'responsável errado': result.wrongOwner,
      'prazo errado': result.wrongDueDate,
      'combinado a mais': result.tooManyExtras ? result.extraAgreements : [],
      'evidência fora da transcrição': result.evidenceNotInTranscript,
      'combinado anterior': result.previousMismatches,
      resumo: result.summaryTooLong ? [`passou de ${MAX_SUMMARY_CHARS} caracteres`] : [],
      'feedback do líder': result.leaderFeedbackEmpty
        ? ['sem pontos fortes nem oportunidades']
        : [],
      'feedback: evidência fora da transcrição': result.leaderEvidenceNotInTranscript,
      'responsabilidade inexistente': result.invalidSignalRefs,
      'responsabilidade esperada não apontada': result.missingSignalRefs,
      sinais: result.tooManySignals ? ['mais de 5 sinais'] : [],
    })) {
      for (const item of items) print(`    ${label}: ${item}`);
    }
  }

  print(`${passedCount}/${names.length} conversas aprovadas`);
};

main().catch((error: unknown) => {
  print(`Erro: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
