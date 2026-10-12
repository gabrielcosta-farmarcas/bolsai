export type Evidence = { key: string; text: string };
export type Segment = { text: string; key?: string };
export type TranscriptLine = { speaker?: string; segments: Segment[] };

const SPEAKER = /^([^:\n]{1,40}):\s+/;
const QUOTES = /^[“"'‘]+|[”"'’]+$/g;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// O trecho citado pela IA pode ter aspas e espaços diferentes; compara sem isso, ignorando a caixa.
const patternFor = (excerpt: string): RegExp | null => {
  const words = excerpt.replace(QUOTES, '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  return new RegExp(words.map(escapeRegExp).join('\\s+'), 'i');
};

const splitLine = (line: string, matches: Array<{ start: number; end: number; key: string }>) => {
  const ordered = [...matches].sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of ordered) {
    if (match.start < cursor) continue; // trechos sobrepostos: vale o primeiro
    if (match.start > cursor) segments.push({ text: line.slice(cursor, match.start) });
    segments.push({ text: line.slice(match.start, match.end), key: match.key });
    cursor = match.end;
  }
  if (cursor < line.length) segments.push({ text: line.slice(cursor) });
  return segments.length > 0 ? segments : [{ text: line }];
};

// Marca na transcrição o primeiro lugar onde cada trecho aparece (um trecho = uma marcação).
export function highlightTranscript(transcript: string, evidence: Evidence[]): TranscriptLine[] {
  const lines = transcript.split('\n').filter((line) => line.trim().length > 0);
  const used = new Set<string>();

  return lines.map((line) => {
    const speakerMatch = SPEAKER.exec(line);
    const speaker = speakerMatch ? `${speakerMatch[1]}:` : undefined;
    const offset = speakerMatch ? speakerMatch[0].length : 0;
    const body = line.slice(offset);

    const matches: Array<{ start: number; end: number; key: string }> = [];
    for (const item of evidence) {
      if (used.has(item.key)) continue;
      const found = patternFor(item.text)?.exec(body);
      if (!found) continue;
      used.add(item.key);
      matches.push({ start: found.index, end: found.index + found[0].length, key: item.key });
    }
    return { speaker, segments: splitLine(body, matches) };
  });
}
