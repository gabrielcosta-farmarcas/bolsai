-- Converte, sem perda, as observações de desenvolvimento antigas (nome livre em "responsibility")
-- para o formato novo (responsibility_id). O nome antigo vira o começo do texto da observação e ela
-- passa a ficar "fora das responsabilidades" (responsibility_id nulo). Roda só nas observações antigas.

UPDATE "analyses"
SET "raw_json" = jsonb_set(
  "raw_json",
  '{development_signals}',
  COALESCE(
    (
      SELECT jsonb_agg(
        CASE
          WHEN s ? 'responsibility' THEN jsonb_build_object(
            'responsibility_id', NULL,
            'observation', (s->>'responsibility') || ': ' || (s->>'observation'),
            'kind', s->'kind'
          )
          ELSE s
        END
      )
      FROM jsonb_array_elements("raw_json"->'development_signals') AS s
    ),
    '[]'::jsonb
  )
)
WHERE jsonb_typeof("raw_json"->'development_signals') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements("raw_json"->'development_signals') AS s WHERE s ? 'responsibility'
  );

UPDATE "analyses"
SET "reviewed_json" = jsonb_set(
  "reviewed_json",
  '{development_signals}',
  COALESCE(
    (
      SELECT jsonb_agg(
        CASE
          WHEN s ? 'responsibility' THEN jsonb_build_object(
            'responsibility_id', NULL,
            'observation', (s->>'responsibility') || ': ' || (s->>'observation'),
            'kind', s->'kind'
          )
          ELSE s
        END
      )
      FROM jsonb_array_elements("reviewed_json"->'development_signals') AS s
    ),
    '[]'::jsonb
  )
)
WHERE jsonb_typeof("reviewed_json"->'development_signals') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements("reviewed_json"->'development_signals') AS s WHERE s ? 'responsibility'
  );
