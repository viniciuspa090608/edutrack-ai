# Validação do apply

## Baseline e escopo

HEAD inicial: `d51ee97dd8123a83b7064da0e6b8d9c8d91810fd` (atualização visual de Pomodoro já concluída). Estado salvo em `baseline-git.txt`: somente as propostas desta mudança e de Conta/Perfil eram untracked; nenhum diff de implementação preexistente. A proposta de Conta/Perfil foi preservada e permanece fora do commit. O inventário do design foi reconfirmado antes de editar; a referência a Pomodoro pendente no design descreve o momento da proposta, não o início deste apply.

Implementação restrita à web: apresentação local comum, Progresso/mural completo, Estatísticas/série e seção de fuso. Nenhuma mudança em API clients, contratos, backend, projeções, concessões, eventos, outras páginas ou dependências. Efeitos, handlers, defaults e validação de consultas/salvamento foram preservados; comparação com HEAD confirmou ausência de mudanças nos efeitos de analytics e na lógica de salvamento de fuso. Únicas derivações adicionais são ordem visual do tempo ativo, ícones/labels de estado e escala geométrica de barras sobre valores existentes.

Referência externa: `C:/Users/vinic/Downloads/ativements_progress_edutrack_ai.zip`, oito pares HTML/PNG analisados durante a proposta e matriz de adaptações em design.md. Nenhum script/CDN/instrução do ZIP foi executado ou incorporado como autoridade do produto.

## Verificações finais

- `pnpm --filter @study-platform/web test src/features/study-progress/StudyProgressPage.spec.tsx src/features/analytics/AnalyticsPage.spec.tsx`: **16 testes aprovados**, dois arquivos. Catálogo real, earnedAt, data no fuso, progresso zero/parcial/acima do alvo, streak atual zero com histórico positivo, ausência de grants, loading/erro/retry, sugestão de fuso não automática, busy/falha/sucesso, cinco filtros suportados com data/fuso explícitos, percent nulo, omissões, séries com zero/lacuna/minutos, 365 amostras sem agrupamento, troca de tema sem perda de dados/draft e refresh/cleanup existentes.
- `pnpm lint`: aprovado, incluindo Prettier.
- `pnpm typecheck`: aprovado.
- `pnpm build`: aprovado. Aviso preexistente de chunk >500 kB continua; não foi ampliado o escopo para otimização global.
- Nenhuma suíte geral, teste backend/banco ou módulo não relacionado executado. Lint/typecheck/build são verificações estáticas/compilação exigidas, não testes de backend.
- O primeiro Vitest no sandbox falhou por spawn EPERM; a mesma suíte funcionou com subprocessos autorizados, sem alterar configuração/dependências. Prettier foi invocado pelo binário Node existente após o wrapper pnpm não localizar o executável no sandbox. Aviso de localstorage-file do runtime de testes sem falhas.

## Navegador com dados reais

Aplicação e API locais já disponíveis, sessão autenticada existente. Sem seed/reset, edição direta do banco, novas atividades ou dados fictícios na aplicação. A única preferência temporariamente alterada foi o tema pelo controle existente, restaurado ao claro original; fuso e preferências de módulos não foram salvos ou alterados. Override de viewport removido ao final.

| Inspeção | Resultado |
| --- | --- |
| Progresso, 320/375/768/1280, claro/escuro | Sete cards reais; documento com larguras 305/360/753/1265 px, respectivamente, sempre dentro da viewport. Grids empilham; nomes e critérios completos; indicador obtido e datas legíveis; valores reais 1 dia atual, 7 de recorde e 27 dias ativos. |
| Estatísticas, 320/375/768/1280, claro/escuro | Mesmo limite do documento; seis métricas reais, unidades preservadas, comparações e contexto disponíveis. Gráficos de semana têm sete datas; sem overflow de página. |
| Select de período | Opções reais Dia/Semana/Trimestre/Semestre/Ano, selected perceptível e portal nos dois temas. Em 320 px, popup entre x=72,8 e x=232,2, largura 159,4 px. Submit por Enter consultou período anual real. |
| Gráfico longo | Consulta anual retorna 277 datas, 2026-01-01 a 2026-10-04; gráfico com scroll local de 27254 px e clientWidth=159 px em 320. Sem compressão, agregação ou novo filtro. Lacunas anteriores à cobertura não viram zero. |
| Teclado do gráfico | Região focável; ArrowRight deslocou scrollLeft a 39,2 px no mobile, com ring visível. Valores e datas também disponíveis na lista textual completa. |
| Período indisponível | Consulta diária de 2025-01-01 mostrou histórico incompleto, valores indisponíveis, percentuais não calculáveis e mensagem de ausência de cobertura; gráficos sem valores recebem texto explicativo. |
| Período vazio | Consulta diária de 2026-10-03 mostrou ausência de atividade, zero real em minutos/contagens e diferenças/percentuais reais em relação ao dia anterior; sem histórico indisponível falso. |
| Fuso de estudo | Seção conferida nos dois temas e quatro larguras; fuso real America/Sao_Paulo, labels/help e botões íntegros. Nenhuma mudança da configuração da conta durante a inspeção. Busy/retry/salvamento/sucesso cobertos em testes UI. |
| Loading | Observado naturalmente em navegação real nas duas páginas e na seção de fuso; skeleton sem números e status acessível. |
| Movimento reduzido | Auditoria CSS: regra local cobre a superfície e seus descendentes, inclusive Progress/Skeleton, e regra separada cobre portal do Select. Sem animação de avanço nos gráficos. Preferência do sistema não foi modificada ou emulada na inspeção. |

A automação do campo date exigiu ArrowUp/ArrowDown para confirmar a edição nativa após fill; valor React e período retornado foram conferidos antes de registrar os resultados. Não foi alterado o handler para acomodar a ferramenta.

Conquistas bloqueadas/parciais, conta sem atividade, erro de transporte e busy/sucesso de salvamento foram validados por testes UI isolados com fixtures, pois a conta real disponível possui todas as conquistas obtidas. Não se declara inspeção visual com API real desses estados, nem se criaram contas/atividades para forçá-los. As classes desses estados utilizam os mesmos tokens/superfícies conferidos nos dois temas.

Contraste calculado a partir dos tokens e misturas locais: texto muted/panel **8,13:1 claro** e **6,18:1 escuro**; status Obtida/inset **5,41:1 claro** e **6,71:1 escuro**. Texto de bloqueadas usa muted com o mesmo contraste; ícones/status complementam cor. A apresentação tem semântica de títulos, listas e dl/dt/dd, aria-current nos links, valores/max reais no Progress e campos rotulados.

Evidências locais (fora do commit):

- `C:/Users/vinic/.codex/visualizations/2026/10/04/01a10826-98e3-76e3-9ed3-63e8b8ec987b/progress-light-desktop.png`
- `C:/Users/vinic/.codex/visualizations/2026/10/04/01a10826-98e3-76e3-9ed3-63e8b8ec987b/analytics-light-annual-mobile.png`
- `C:/Users/vinic/.codex/visualizations/2026/10/04/01a10826-98e3-76e3-9ed3-63e8b8ec987b/analytics-dark-unavailable.png`
- `C:/Users/vinic/.codex/visualizations/2026/10/04/01a10826-98e3-76e3-9ed3-63e8b8ec987b/timezone-dark-desktop.png`

## Arquivos incluídos no commit único

- `apps/web/src/features/analytics/AnalyticsPage.tsx`
- `apps/web/src/features/analytics/AnalyticsPage.spec.tsx`
- `apps/web/src/features/study-progress/ProgressPresentation.tsx`
- `apps/web/src/features/study-progress/StudyProgressPage.tsx`
- `apps/web/src/features/study-progress/StudyProgressPage.spec.tsx`
- `apps/web/src/features/study-progress/StudyTimeZoneSection.tsx`
- `apps/web/src/styles/analytics.css`
- `apps/web/src/styles/progress-presentation.css`
- `apps/web/src/styles/study-progress.css`
- `openspec/changes/update-progress-and-achievements-from-stitch/.openspec.yaml`
- `openspec/changes/update-progress-and-achievements-from-stitch/proposal.md`
- `openspec/changes/update-progress-and-achievements-from-stitch/design.md`
- `openspec/changes/update-progress-and-achievements-from-stitch/specs/progress-and-achievements-visual-experience/spec.md`
- `openspec/changes/update-progress-and-achievements-from-stitch/tasks.md`
- `openspec/changes/update-progress-and-achievements-from-stitch/baseline-git.txt`
- `openspec/changes/update-progress-and-achievements-from-stitch/validation.md`

Revisão staged concluída: somente os 16 arquivos listados, com a proposta de Conta/Perfil fora do stage. `git diff --cached --check` aprovado antes do commit único. Hash e arquivos confirmados pelo Git no encerramento do apply. Sem tag, push ou archive automático.
