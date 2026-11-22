# Design

## Context

Ver proposal.md. Os módulos registram tarefas, intervalos reais de foco e autoavaliações AGAIN/HARD/GOOD/EASY, sem provas acadêmicas.

## Goals / Non-Goals

**Goals:** uma meta persistida por disciplina, consultas isoladas e cálculos auditáveis.
**Non-Goals:** múltiplas metas simultâneas e inferência de notas. A personalização textual pela IA é opcional; esta entrega usa textos determinísticos sem enviar dados a provedores.

## Decisions

- Indicadores: quantidade atual de tarefas concluídas vinculadas (inclui histórico), horas reais em sessões encerradas desde a criação da meta, percentual GOOD/EASY nas revisões desde a criação. HARD/AGAIN não contam como acerto; a interface explica que são autoavaliações.
- Editar valor/prazo preserva início; mudar indicador reinicia a janela. Prazo é uma data inclusiva no fuso IANA informado, persistido na meta. Datas futuras exigidas na gravação, metas vencidas continuam consultáveis.
- Cada produtor expõe leitura pública com usuário e disciplina. Consultas de insights não usam repositories internos de outros módulos. Módulos desligados não fornecem evidências nem permitem novos indicadores; metas preservadas mostram indisponibilidade.
- Ritmo usa janela móvel de até 7 dias, com ao menos um dia observado e amostras reais; tarefas usam eventos de conclusão ainda vinculados e estado atual. Comparação é estimativa, nunca promessa. Percentual de revisões não recebe projeção linear; tendência compara duas janelas de 7 dias com mínimo de 5 revisões em cada.
- Recalcular a cada leitura e após salvar; atualizar ao foco, visibilidade e periodicamente com proteção contra respostas antigas. Sem cache persistente.

## Risks / Trade-offs

- Autoavaliações não são notas → rotular a métrica e não inferir desempenho acadêmico.
- Histórico pequeno → explicitar insuficiência e não projetar.
- Alterações concorrentes → uma linha por disciplina com chave única e upsert transacional.

## Migration Plan

Aplicar migration antes da API. Rollback remove somente a tabela de metas, com perda dessas configurações; registros produtores permanecem.
