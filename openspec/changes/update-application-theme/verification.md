# Verificação da identidade visual



## Base e escopo



Apply iniciado em master, HEAD cb74ca3 (migração Shadcn concluída). Estado inicial e patch das alterações preexistentes registrados antes das edições e comparados por SHA-256 após a implementação (patch preexistente idêntico). Arquivos da interface estavam limpos. Mudanças anteriores em .env.example, README.md raiz, package.json raiz, arquivos OpenSpec arquivados e demais artefatos foram preservadas e ficam fora do commit.



## Contraste



Pares centrais calculados pela luminância relativa sRGB; testes de regressão verificam todos os pares, overlays de hover e indicadores sobre background/card/popover.



| Par | Claro | Escuro | Limiar |

| --- | --- | --- | --- |

| foreground / background | 14.63:1 | 14.63:1 | 4.5:1 |

| card-foreground / card | 13.01:1 | 10.91:1 | 4.5:1 |

| primary-foreground / primary | 9.68:1 | 7.97:1 | 4.5:1 |

| secondary-foreground / secondary | 6.90:1 | 7.76:1 | 4.5:1 |

| muted-foreground / muted | 6.90:1 | 5.55:1 | 4.5:1 |

| accent-foreground / accent | 14.65:1 | 8.42:1 | 4.5:1 |

| success / card | 5.02:1 | 6.72:1 | 4.5:1 |

| warning / card | 5.65:1 | 6.17:1 | 4.5:1 |

| destructive / card | 6.60:1 | 5.47:1 | 4.5:1 |

| info / card | 8.60:1 | 7.72:1 | 4.5:1 |

| input / card | 3.95:1 | 5.55:1 | 3:1 |

| ring / card | 4.10:1 | 7.72:1 | 3:1 |



## Inspeção no navegador



As páginas reais foram renderizadas em um harness temporário de QA com respostas HTTP de fixture, sem modificar o backend nem persistir dados. Rotas: /, /acesso, /confirmar-email, /recuperar-senha, /status, /app, /conta, /app/tarefas, /app/materias, /app/rotinas, /app/pomodoro, /app/flashcards, /app/estatisticas e /app/progresso.



- Inspeção em 1280 px e 320 px nos temas claro/escuro; nenhum overflow horizontal nas 14 páginas. Texto renderizado medido por estilos computados e composição de fundos, incluindo cores oklab de hover.

- Landing após correções: mínimo 6,90:1 claro e 5,55:1 escuro; acesso/cadastro: mínimo 6,90:1 claro, 5,55:1 escuro.

- 60 verificações adicionais de loading, erro e vazio nas dez rotas com dados, em ambos os temas a 320 px: nenhuma falha de contraste ou overflow.

- Diálogo de criação de tarefa a 320 px: mínimo de texto 7,76:1 claro e 7,43:1 escuro; edição e foco preservados ao alternar, portal aberto, fechamento por Escape.

- Abas de acesso navegáveis com ArrowRight; foco com ring opaco e campos/editors legíveis. Controles nativos usam color-scheme e option com par popover.

- Movimento reduzido: navegação manual do carrossel com consulta de preferência simulada; regras CSS de redução preservadas. As suítes existentes validam fluxos manuais, importação, IA, revisão, perfil, roadmaps, temporizadores, dashboard e estados. Nenhuma mudança nos handlers de negócio ou estrutura dessas telas.

- Analytics atual apresenta métricas/séries textuais, sem gráfico vetorial a recolorir; chart-1/2/3 e mappings estão completos para os consumidores compartilhados.

- Arte SVG é decorativa, em prancheta clara autocontida com literais da nova paleta; nenhuma alteração de geometria ou alternativas textuais.



## Verificações finais



- `pnpm lint`: aprovado, incluindo ESLint e formatação.
- `pnpm typecheck`: aprovado para todos os pacotes.
- `pnpm test`: 37 testes de contracts, 189 de API com MySQL real isolado e 136 de web; total 362 aprovados.
- `pnpm build`: aprovado; aviso de tamanho do bundle web existente, sem falha de build.
- `openspec validate update-application-theme --strict`: aprovado.
- Patch das alterações preexistentes: SHA-256 idêntico antes/depois.



## Arquivos incluídos no commit da mudança

- `apps/web/public/illustrations/flashcards.svg`
- `apps/web/public/illustrations/focus.svg`
- `apps/web/public/illustrations/roadmap.svg`
- `apps/web/public/illustrations/tasks.svg`
- `apps/web/src/app/theme-colors.spec.ts`
- `apps/web/src/app/theme.spec.tsx`
- `apps/web/src/app/theme.ts`
- `apps/web/src/features/landing/FeatureCarousel.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/styles/auth.css`
- `apps/web/src/styles/flashcards.css`
- `apps/web/src/styles/landing.css`
- `apps/web/src/styles/main.css`
- `apps/web/src/styles/subjects.css`
- `openspec/changes/update-application-theme/.openspec.yaml`
- `openspec/changes/update-application-theme/design.md`
- `openspec/changes/update-application-theme/proposal.md`
- `openspec/changes/update-application-theme/specs/application-theme/spec.md`
- `openspec/changes/update-application-theme/tasks.md`
- `openspec/changes/update-application-theme/verification.md`
- `packages/ui/README.md`
- `packages/ui/src/components/ui/alert.tsx`
- `packages/ui/src/components/ui/badge.tsx`
- `packages/ui/src/components/ui/button.tsx`
- `packages/ui/src/components/ui/checkbox.tsx`
- `packages/ui/src/components/ui/input.tsx`
- `packages/ui/src/components/ui/native-select.tsx`
- `packages/ui/src/components/ui/progress.tsx`
- `packages/ui/src/components/ui/select.tsx`
- `packages/ui/src/components/ui/tabs.tsx`
- `packages/ui/src/components/ui/textarea.tsx`
- `packages/ui/src/status-panel.tsx`
- `packages/ui/src/styles/globals.css`
