# Evidências de validação

- Baseline: branch codex/classroom-import-results, HEAD fc27434d436f7ba4004eee2c0777e44a5df49e08. Os três arquivos ClassroomSection.tsx, ClassroomSection.spec.tsx e classroom.css já continham os ajustes autorizados neste chat; o patch inicial foi preservado em .openspec-local.
- Diagnóstico real sanitizado e limitado à conta solicitante: 91 tarefas adicionadas; 12 disciplinas ignoradas sem destino; 3 tarefas com descrição acima de 2.000 caracteres. Nenhuma evidência de indisponibilidade do Google. Os casos foram reproduzidos em bancos MySQL isolados, com recuperação e idempotência.
- pnpm lint, pnpm typecheck, pnpm test e pnpm build aprovados. Suíte completa: 22 testes de workflow, 42 de contratos, 313 de API e 322 de web. O fluxo final executa novamente as verificações sobre os arquivos finais.
- A falha anterior de workflow não se reproduziu ao permitir os subprocessos necessários. A nova migration exigiu adaptar o teste de rollback de rotinas para localizar a migration pelo nome, preservando a verificação original.
- Migration de created_at aplicada no banco local: 1 migration. Testes verificam backfill e rollback sem apagar mensagens.
- Validação de navegador headless usa componentes reais com dados sintéticos, sem sessão pessoal ou chamadas ao provedor. Capturas cobrem ambos os temas, 1440 × 900, 1280 × 600, 320 × 740 e 320 × 460. A última altura simula área reduzida de teclado virtual, não um teclado móvel nativo.
- Scrolls: histórico deslocado a 100 px e conversa a 200 px independentemente; scroll global permaneceu 0; sem overflow horizontal. Compositor manteve-se dentro da área útil em todas as dimensões.
- Checkbox medido em 16 × 16 px em desktop e mobile, com seleção por teclado. Modal mantém foco ao usar Shift+Tab, fecha com Escape e devolve foco a “Mais detalhes”.
- Estados vazio/concluído sem adições, carregamento/na fila, erro e parcial têm evidência visual. Retry, conflitos, paginação e recolhimento após recarga são cobertos pelos testes.
- Merge revisado: ai-study-assistant resulta em 10 requisitos e 21 cenários; google-classroom-integration em 12 requisitos e 22 cenários. Todos os cenários preexistentes do requisito modificado foram preservados. Snapshots em .openspec-local/reviewed são aplicados somente pelo fluxo de conclusão.
- Build mantém aviso de bundle maior que 500 kB; não impede a compilação.
