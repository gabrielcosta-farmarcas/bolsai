-- seed: local/dev only — dados fictícios (nenhuma pessoa real)
-- depende das migrations até 20261024120000_preparations
-- encoding: UTF-8
-- idempotente: ids fixos + ON CONFLICT DO NOTHING
-- Júlia Ferraz: 3 encontros revisados, 2 combinados em aberto (1 atrasado), 1 responsabilidade nunca conversada,
-- e um roteiro do "Preparar 1:1" já pronto (sem precisar da chave da IA).

BEGIN;

INSERT INTO direct_reports (id, leader_id, name, role, started_at, status, created_at, updated_at)
VALUES ('018f0000-0000-7000-8000-000000000101', '00000000-0000-7000-8000-000000000001',
        'Júlia Ferraz', 'Analista de atendimento', '2024-06-03', 'active', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO responsibility_maps (id, leader_id, direct_report_id, version, file_type, text, mission, behaviors, created_at, updated_at)
VALUES ('018f0000-0000-7000-8000-000000000111', '00000000-0000-7000-8000-000000000001',
        '018f0000-0000-7000-8000-000000000101', 1, 'text',
        E'Atender os clientes com clareza e dentro do prazo.\nRegistrar as demandas no CRM.\nPropor melhorias nos processos de atendimento.\nApoiar a integração de pessoas novas no time.',
        'Cuidar da experiência do cliente do primeiro contato à solução.',
        'Dá feedback com clareza. Pede ajuda cedo quando um prazo está em risco.',
        now(), now())
ON CONFLICT (direct_report_id, version) DO NOTHING;

INSERT INTO responsibilities (id, leader_id, direct_report_id, position, text, title, title_source, key, created_at, updated_at)
VALUES
  ('018f0000-0000-7000-8000-000000000121', '00000000-0000-7000-8000-000000000001', '018f0000-0000-7000-8000-000000000101',
   1, 'Atender os clientes com clareza e dentro do prazo.', 'Atendimento', 'leader', 'atender os clientes com clareza e dentro do prazo.', now(), now()),
  ('018f0000-0000-7000-8000-000000000122', '00000000-0000-7000-8000-000000000001', '018f0000-0000-7000-8000-000000000101',
   2, 'Registrar as demandas no CRM.', 'Registro no CRM', 'leader', 'registrar as demandas no crm.', now(), now()),
  ('018f0000-0000-7000-8000-000000000123', '00000000-0000-7000-8000-000000000001', '018f0000-0000-7000-8000-000000000101',
   3, 'Propor melhorias nos processos de atendimento.', 'Melhoria de processos', 'leader', 'propor melhorias nos processos de atendimento.', now(), now()),
  ('018f0000-0000-7000-8000-000000000124', '00000000-0000-7000-8000-000000000001', '018f0000-0000-7000-8000-000000000101',
   4, 'Apoiar a integração de pessoas novas no time.', 'Integração de pessoas novas', 'leader', 'apoiar a integração de pessoas novas no time.', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, leader_id, direct_report_id, held_on, transcript, status, created_at, updated_at)
VALUES
  ('018f0000-0000-7000-8000-000000000131', '00000000-0000-7000-8000-000000000001', '018f0000-0000-7000-8000-000000000101', '2026-09-11',
   E'Gestor: Júlia, como estão as demandas?\nJúlia: Tranquilas. Tenho uma ideia para reduzir o retrabalho nos chamados repetidos.\nGestor: Me manda uma proposta curta.\nJúlia: Mando até dia 25.',
   'reviewed', now(), now()),
  ('018f0000-0000-7000-8000-000000000132', '00000000-0000-7000-8000-000000000001', '018f0000-0000-7000-8000-000000000101', '2026-09-25',
   E'Gestor: E a proposta dos chamados repetidos?\nJúlia: Ainda não terminei, o volume de atendimentos subiu.\nGestor: Combinamos um novo prazo, então.\nJúlia: Até dia 15 de outubro.',
   'reviewed', now(), now()),
  ('018f0000-0000-7000-8000-000000000133', '00000000-0000-7000-8000-000000000001', '018f0000-0000-7000-8000-000000000101', '2026-10-09',
   E'Gestor: Como está o atendimento este mês?\nJúlia: Bem, mas o registro no CRM está ficando para o fim do dia.\nGestor: Vamos olhar isso juntos.\nJúlia: Posso te mostrar uma amostra na próxima semana.',
   'reviewed', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO analyses (id, leader_id, session_id, model, status, map_version_used, raw_json, reviewed_json, reviewed_at, created_at, updated_at)
SELECT v.id, '00000000-0000-7000-8000-000000000001', v.session_id, 'modelo-de-exemplo', 'completed', 1, v.j, v.j, v.held_at, now(), now()
FROM (VALUES
  ('018f0000-0000-7000-8000-000000000141'::uuid, '018f0000-0000-7000-8000-000000000131'::uuid, '2026-09-11 21:00:00+00'::timestamptz,
   '{"summary":"Demandas tranquilas. Júlia propôs reduzir o retrabalho nos chamados repetidos e ficou de enviar uma proposta curta até o dia 25.","themes":[{"title":"Chamados repetidos","detail":"Ideia para reduzir retrabalho."}],"agreements":[],"previous_agreements":[],"development_signals":[{"responsibility_id":"018f0000-0000-7000-8000-000000000123","observation":"Trouxe uma ideia de melhoria para os chamados repetidos.","kind":"growth"},{"responsibility_id":"018f0000-0000-7000-8000-000000000121","observation":"Demandas do mês sob controle.","kind":"neutral"}],"attention_points":[],"next_questions":[],"private_leader_notes":"Cobrar a proposta no próximo encontro.","leader_feedback":{"overall":"went_well","overall_note":"Boa escuta e pedido claro.","strengths":[],"opportunities":[]}}'::jsonb),
  ('018f0000-0000-7000-8000-000000000142'::uuid, '018f0000-0000-7000-8000-000000000132'::uuid, '2026-09-25 21:00:00+00'::timestamptz,
   '{"summary":"A proposta dos chamados repetidos não ficou pronta por causa do aumento de volume. Novo prazo: dia 15 de outubro.","themes":[{"title":"Chamados repetidos","detail":"Proposta adiada por causa do volume."},{"title":"Volume de atendimentos","detail":"Subiu neste mês."}],"agreements":[{"description":"Enviar a proposta para reduzir chamados repetidos","owner":"report","due_date":"2026-10-15","evidence_excerpt":"Até dia 15 de outubro."}],"previous_agreements":[],"development_signals":[{"responsibility_id":"018f0000-0000-7000-8000-000000000121","observation":"Volume de atendimentos subiu e pressionou os prazos.","kind":"neutral"},{"responsibility_id":"018f0000-0000-7000-8000-000000000122","observation":"Registro em dia nas demandas citadas.","kind":"neutral"}],"attention_points":["Pessoa: proposta dos chamados repetidos adiada."],"next_questions":[],"private_leader_notes":"","leader_feedback":{"overall":"mixed","overall_note":"Novo prazo combinado, sem rever a carga.","strengths":[],"opportunities":[]}}'::jsonb),
  ('018f0000-0000-7000-8000-000000000143'::uuid, '018f0000-0000-7000-8000-000000000133'::uuid, '2026-10-09 21:00:00+00'::timestamptz,
   '{"summary":"Atendimento bem, mas o registro no CRM tem ficado para o fim do dia. Júlia vai mostrar uma amostra na próxima semana.","themes":[{"title":"Registro no CRM","detail":"Acumulando para o fim do dia."},{"title":"Chamados repetidos","detail":"Proposta ainda pendente."}],"agreements":[{"description":"Mostrar uma amostra do registro no CRM","owner":"report","due_date":null,"evidence_excerpt":"Posso te mostrar uma amostra na próxima semana."},{"description":"Revisar com a Júlia o fluxo de registro no CRM","owner":"leader","due_date":"2026-10-30","evidence_excerpt":"Vamos olhar isso juntos."}],"previous_agreements":[],"development_signals":[{"responsibility_id":"018f0000-0000-7000-8000-000000000122","observation":"Registro acumulando para o fim do dia.","kind":"attention"},{"responsibility_id":"018f0000-0000-7000-8000-000000000121","observation":"Atendimento do mês sem queixas.","kind":"neutral"}],"attention_points":["Pessoa: proposta dos chamados repetidos segue sem entrega."],"next_questions":[],"private_leader_notes":"Perguntar da proposta e do CRM.","leader_feedback":{"overall":"went_well","overall_note":"Combinados claros de ambos os lados.","strengths":[],"opportunities":[]}}'::jsonb)
) AS v(id, session_id, held_at, j)
ON CONFLICT (id) DO NOTHING;

INSERT INTO agreements (id, leader_id, direct_report_id, origin_session_id, analysis_id, description, owner, due_date, status, evidence_excerpt, origin, confirmed_at, created_at, updated_at)
VALUES
  ('018f0000-0000-7000-8000-000000000151', '00000000-0000-7000-8000-000000000001', '018f0000-0000-7000-8000-000000000101',
   '018f0000-0000-7000-8000-000000000132', '018f0000-0000-7000-8000-000000000142',
   'Enviar a proposta para reduzir chamados repetidos', 'report', '2026-10-15', 'open', 'Até dia 15 de outubro.', 'ai', now(), now(), now()),
  ('018f0000-0000-7000-8000-000000000152', '00000000-0000-7000-8000-000000000001', '018f0000-0000-7000-8000-000000000101',
   '018f0000-0000-7000-8000-000000000133', '018f0000-0000-7000-8000-000000000143',
   'Revisar com a Júlia o fluxo de registro no CRM', 'leader', '2026-10-30', 'open', 'Vamos olhar isso juntos.', 'ai', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO preparations (id, leader_id, direct_report_id, model, status, map_version_used, content, created_at, updated_at)
VALUES ('018f0000-0000-7000-8000-000000000161', '00000000-0000-7000-8000-000000000001', '018f0000-0000-7000-8000-000000000101',
        'modelo-de-exemplo', 'completed', 1,
        '{"has_history":true,
          "questions":["O que tem dificultado terminar a proposta dos chamados repetidos?","Em que ponto do dia o registro no CRM costuma ficar para depois?","Onde você gostaria de crescer nos próximos meses?","O que posso fazer diferente para apoiar você nas semanas de volume alto?","Como você vê a integração de pessoas novas no time hoje?"],
          "open_agreements":[{"id":"018f0000-0000-7000-8000-000000000151","description":"Enviar a proposta para reduzir chamados repetidos","owner":"report","due_date":"2026-10-15","is_overdue":true},{"id":"018f0000-0000-7000-8000-000000000152","description":"Revisar com a Júlia o fluxo de registro no CRM","owner":"leader","due_date":"2026-10-30","is_overdue":false}],
          "themes":[{"title":"Chamados repetidos","detail":"A proposta foi adiada duas vezes e segue sem entrega."},{"title":"Registro no CRM","detail":"Acumulando para o fim do dia."}],
          "map_gaps":[{"responsibility_id":"018f0000-0000-7000-8000-000000000124","title":"Integração de pessoas novas","last_discussed_on":null}]}'::jsonb,
        now(), now())
ON CONFLICT (id) DO NOTHING;

COMMIT;
