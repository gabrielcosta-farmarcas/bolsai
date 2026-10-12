-- seed: local/dev only — dados fictícios (nenhuma pessoa real)
-- depende de 20261011160000_demo_sessions.sql e das migrations até 20261011170000_agreements
-- encoding: UTF-8
-- idempotente: ids fixos + ON CONFLICT DO NOTHING
-- Combinados da Ana Beatriz Moura: um concluído (encontro de 10/09), dois salvos pela IA no encontro
-- de 01/10 (um ainda não revisado) e um criado à mão e atrasado.

BEGIN;

INSERT INTO agreements (id, leader_id, direct_report_id, origin_session_id, analysis_id, description, owner, due_date, status, evidence_excerpt, origin, confirmed_at, closed_at, created_at, updated_at)
VALUES
  ('018f0000-0000-7000-8000-0000000000f1', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000a1', '018f0000-0000-7000-8000-0000000000d1',
   '018f0000-0000-7000-8000-0000000000e1',
   'Revisar o painel de vendas', 'report', '2026-09-24', 'done',
   'Fechado, reviso até dia 24.', 'ai', '2026-09-10 21:00:00+00', '2026-10-01 14:00:00+00', now(), now()),
  ('018f0000-0000-7000-8000-0000000000f2', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000a1', '018f0000-0000-7000-8000-0000000000d2',
   '018f0000-0000-7000-8000-0000000000e2',
   'Escrever a primeira versão da documentação das bases', 'report', '2026-10-15', 'open',
   'Vou escrever a primeira versão até dia 15.', 'ai', '2026-10-01 21:00:00+00', NULL, now(), now()),
  ('018f0000-0000-7000-8000-0000000000f3', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000a1', '018f0000-0000-7000-8000-0000000000d2',
   '018f0000-0000-7000-8000-0000000000e2',
   'Enviar duas opções de curso de modelagem estatística, com preço', 'report', NULL, 'open',
   'Mando até a semana que vem.', 'ai', NULL, NULL, now(), now()),
  ('018f0000-0000-7000-8000-0000000000f4', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000a1', NULL, NULL,
   'Combinar uma conversa de mentoria com a Carla', 'leader', '2026-10-05', 'open',
   NULL, 'leader', '2026-10-01 21:30:00+00', NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

COMMIT;
