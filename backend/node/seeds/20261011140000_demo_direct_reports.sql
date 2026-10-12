-- seed: local/dev only — dados fictícios (nenhuma pessoa real)
-- depende das migrations até 20261011130000 (leaders, direct_reports, responsibility_maps)
-- encoding: UTF-8
-- idempotente: ids fixos + ON CONFLICT DO NOTHING

BEGIN;

INSERT INTO direct_reports (id, leader_id, name, role, started_at, status, deleted_at, created_at, updated_at)
VALUES
  ('018f0000-0000-7000-8000-0000000000a1', '00000000-0000-7000-8000-000000000001',
   'Ana Beatriz Moura', 'Analista de dados pleno', '2024-02-05', 'active', NULL, now(), now()),
  ('018f0000-0000-7000-8000-0000000000a2', '00000000-0000-7000-8000-000000000001',
   'Carlos Henrique Dias', 'Desenvolvedor pleno', '2023-08-14', 'active', NULL, now(), now()),
  ('018f0000-0000-7000-8000-0000000000a3', '00000000-0000-7000-8000-000000000001',
   'Marina Tavares', 'Designer de produto', '2025-01-20', 'active', NULL, now(), now()),
  ('018f0000-0000-7000-8000-0000000000a4', '00000000-0000-7000-8000-000000000001',
   'Paulo Roberto Lima', 'Analista de suporte', '2022-05-09', 'inactive', NULL, now(), now()),
  -- Excluída logicamente: serve para conferir que some de todas as telas.
  ('018f0000-0000-7000-8000-0000000000a5', '00000000-0000-7000-8000-000000000001',
   'Exemplo Excluído', 'Cargo fictício', '2021-11-01', 'active', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO responsibility_maps (id, leader_id, direct_report_id, version, file_name, file_type, text, file_bytes, created_at, updated_at)
VALUES
  ('018f0000-0000-7000-8000-0000000000b1', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000a1', 1, NULL, 'text',
   E'Responsabilidades da Analista de dados pleno\n\n1. Qualidade dos dados: garantir que as bases usadas pelo time estejam corretas e documentadas.\n2. Análises e painéis: entregar análises que apoiem decisões de produto, com linguagem clara.\n3. Comunicação com áreas parceiras: alinhar prazos e expectativas com quem pede os dados.\n4. Desenvolvimento técnico: evoluir em modelagem estatística e automação de rotinas.',
   NULL, now(), now()),
  ('018f0000-0000-7000-8000-0000000000b2', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000a1', 2, NULL, 'text',
   E'Responsabilidades da Analista de dados pleno (revisado)\n\n1. Qualidade dos dados: garantir que as bases usadas pelo time estejam corretas e documentadas.\n2. Análises e painéis: entregar análises que apoiem decisões de produto, com linguagem clara.\n3. Comunicação com áreas parceiras: alinhar prazos e expectativas com quem pede os dados.\n4. Desenvolvimento técnico: evoluir em modelagem estatística e automação de rotinas.\n5. Mentoria: apoiar pessoas mais novas no time com revisão de análises.',
   NULL, now(), now()),
  ('018f0000-0000-7000-8000-0000000000b3', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000a2', 1, NULL, 'text',
   E'Responsabilidades do Desenvolvedor pleno\n\n1. Entrega com qualidade: código revisado, testado e simples de manter.\n2. Autonomia técnica: decidir soluções para problemas de média complexidade.\n3. Colaboração: revisar o código de colegas e compartilhar conhecimento.\n4. Planejamento: estimar e comunicar riscos das próprias tarefas.',
   NULL, now(), now())
ON CONFLICT (direct_report_id, version) DO NOTHING;

COMMIT;
