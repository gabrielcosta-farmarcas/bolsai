-- seed: local/dev only — dados fictícios (nenhuma pessoa real)
-- depende de 20261011140000_demo_direct_reports.sql e das migrations até 20261011150000
-- encoding: UTF-8
-- idempotente: ids fixos + ON CONFLICT DO NOTHING
-- Ana Beatriz Moura: um 1:1 já revisado (10/09) e um analisado, aguardando revisão (01/10).

BEGIN;

INSERT INTO sessions (id, leader_id, direct_report_id, held_on, transcript, status, created_at, updated_at)
VALUES
  ('018f0000-0000-7000-8000-0000000000d1', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000a1', '2026-09-10',
   E'Gestor: Ana, como está a carga de trabalho?\nAna: Está puxada, mas administrável. O painel de vendas é a prioridade.\nGestor: Combinado então: você revisa o painel de vendas até o fim do mês.\nAna: Fechado, reviso até dia 24.\nGestor: E sobre a documentação das bases?\nAna: Quero começar, mas ainda sem data.',
   'reviewed', now(), now()),
  ('018f0000-0000-7000-8000-0000000000d2', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000a1', '2026-10-01',
   E'Gestor: Ana, na última vez ficou combinado que você revisaria o painel de vendas. Como ficou?\nAna: Já terminei e publiquei. Os números batem com a base nova.\nGestor: Ótimo. E aquela documentação das bases?\nAna: Ainda não comecei. Vou escrever a primeira versão até dia 15.\nGestor: Pode ser. Eu te ajudo revisando quando ficar pronta.\nAna: Outra coisa: gostaria de estudar modelagem estatística mais a fundo.\nGestor: Me manda duas opções de curso com preço e eu vejo com o RH.\nAna: Mando até a semana que vem.',
   'analysed', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO analyses (id, leader_id, session_id, prompt_version, model, status, map_version_used, raw_json, reviewed_json, reviewed_at, created_at, updated_at)
VALUES
  ('018f0000-0000-7000-8000-0000000000e1', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000d1', 'v1', 'modelo-de-exemplo', 'completed', 1,
   '{"summary":"Conversa sobre a carga de trabalho de Ana, que está puxada, mas administrável. O painel de vendas é a prioridade do momento e ficou combinada a revisão até o dia 24. A documentação das bases ainda não tem data para começar.","themes":[{"title":"Carga de trabalho","detail":"Puxada, mas administrável."},{"title":"Painel de vendas","detail":"Prioridade atual da Ana."}],"agreements":[{"description":"Revisar o painel de vendas","owner":"report","due_date":"2026-09-24","evidence_excerpt":"Fechado, reviso até dia 24."}],"previous_agreements":[],"development_signals":[{"responsibility":"Análises e painéis","observation":"Assumiu a revisão do painel de vendas como prioridade.","kind":"growth"}],"attention_points":["Documentação das bases ainda sem data"],"next_questions":["O que você gostaria de aprender nos próximos meses?","Como está o equilíbrio entre as demandas das áreas parceiras?","Que feedback você tem para mim sobre como apoio o seu trabalho?"],"private_leader_notes":"Acompanhar a carga nas próximas semanas."}',
   '{"summary":"Conversa sobre a carga de trabalho de Ana, que está puxada, mas administrável. O painel de vendas é a prioridade do momento e ficou combinada a revisão até o dia 24. A documentação das bases ainda não tem data para começar.","themes":[{"title":"Carga de trabalho","detail":"Puxada, mas administrável."},{"title":"Painel de vendas","detail":"Prioridade atual da Ana."}],"agreements":[{"description":"Revisar o painel de vendas","owner":"report","due_date":"2026-09-24","evidence_excerpt":"Fechado, reviso até dia 24."}],"previous_agreements":[],"development_signals":[{"responsibility":"Análises e painéis","observation":"Assumiu a revisão do painel de vendas como prioridade.","kind":"growth"}],"attention_points":["Documentação das bases ainda sem data"],"next_questions":["O que você gostaria de aprender nos próximos meses?","Como está o equilíbrio entre as demandas das áreas parceiras?","Que feedback você tem para mim sobre como apoio o seu trabalho?"],"private_leader_notes":"Acompanhar a carga nas próximas semanas."}',
   '2026-09-10 21:00:00+00', now(), now()),
  ('018f0000-0000-7000-8000-0000000000e2', '00000000-0000-7000-8000-000000000001',
   '018f0000-0000-7000-8000-0000000000d2', 'v1', 'modelo-de-exemplo', 'completed', 2,
   '{"summary":"Ana concluiu e publicou a revisão do painel de vendas, com números conferidos na base nova. A documentação das bases ainda não começou e ela se comprometeu a entregar a primeira versão até o dia 15. Ana também manifestou interesse em estudar modelagem estatística.","themes":[{"title":"Painel de vendas concluído","detail":"Publicado e conferido com a base nova."},{"title":"Interesse em modelagem estatística","detail":"Quer um curso e vai levantar opções."}],"agreements":[{"description":"Enviar duas opções de curso de modelagem estatística, com preço","owner":"report","due_date":null,"evidence_excerpt":"Mando até a semana que vem."},{"description":"Escrever a primeira versão da documentação das bases","owner":"report","due_date":"2026-10-15","evidence_excerpt":"Vou escrever a primeira versão até dia 15."}],"previous_agreements":[],"development_signals":[{"responsibility":"Desenvolvimento técnico","observation":"Pediu apoio para aprofundar modelagem estatística.","kind":"growth"},{"responsibility":"Qualidade dos dados","observation":"A documentação das bases segue pendente.","kind":"attention"}],"attention_points":["Documentação das bases atrasada em relação ao combinado anterior"],"next_questions":["Que tipo de projeto usaria o que você quer aprender em modelagem?","O que tem dificultado começar a documentação?","Que feedback você tem para mim neste período?"],"private_leader_notes":""}',
   NULL, NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

COMMIT;
