# Tasks

## 1. Base e tokens compartilhados

- [x] 1.1 Registrar branch, HEAD, Git status e diffs preexistentes; confirmar base estável de refactor-ui-to-shadcn e delimitar hunks desta mudança com registro verificável antes das edições.
- [x] 1.2 Definir os tokens claros e escuros em globals.css com as paletas do design, incluindo pares foreground, input, ring, overlay e gráficos; verificar que cada token consumido tem valor em ambos os temas e mapping Tailwind válido.
- [x] 1.3 Completar tokens de success, warning, destructive e info necessários e ajustar variantes compartilhadas, incluindo Button/Badge destrutivos; verificar renderização com pares semânticos sem text-white fixo quando houver token equivalente.
- [x] 1.4 Documentar tabela final, regras de uso e exceções de assets em packages/ui/README.md; verificar correspondência da documentação com tokens implementados.

## 2. Ativação dos temas

- [x] 2.1 Inicializar tema conforme prefers-color-scheme antes da renderização, sincronizar mudanças e color-scheme com fallback claro; verificar primeira apresentação, controles nativos e overlays em ambos os temas.
- [x] 2.2 Testar preferência inicial clara/escura, alteração durante sessão e ambiente sem matchMedia; confirmar que formulário preenchido, foco e rota permanecem após troca de tema.

## 3. Migração gradual das páginas

- [x] 3.1 Migrar landing, acesso e páginas de autenticação para os papéis semânticos corretos; verificar os dois temas, header, menus, formulários e estados existentes sem mudar estrutura ou fluxos.
- [x] 3.2 Recolorir verdes decorativos das ilustrações da landing com a paleta fornecida, mantendo forma, inclusão por img e alternativas textuais; verificar legibilidade da arte em ambos os temas e documentar literais isolados necessários.
- [x] 3.3 Migrar dashboard e perfil, incluindo navegação, cards, feedback e campos; verificar aparência clara/escura e preservação de ações e preferências existentes.
- [x] 3.4 Migrar tarefas e matérias/roadmaps, incluindo progresso, menus, diálogos e confirmações; verificar tema herdado pelos overlays e fluxos existentes nos dois temas.
- [x] 3.5 Migrar rotinas e Pomodoro; verificar controles, estados de sessão e feedback em ambos os temas, preservando temporizadores e regras existentes.
- [x] 3.6 Migrar flashcards e fluxos manual, importação, IA, revisão e histórico; verificar loading, vazio, erros, seleção e sucesso aplicáveis nos dois temas sem alterar comportamento dos cartões.
- [x] 3.7 Migrar analytics, progresso de estudo e página técnica de status; verificar gráficos, legendas e estados aplicáveis nos dois temas preservando cálculos e chamadas existentes.

## 4. Limpeza e validação integrada

- [x] 4.1 Remover tokens e cores antigas sem consumidores; auditar CSS/TSX e assets com rg para hex, rgb/hsl, cores arbitrárias e classes de escala direta, verificando que ocorrências restantes estejam nas definições centrais ou exceções documentadas.
- [x] 4.2 Medir e registrar contraste dos pares renderizados de texto, controles ativos, foco e status em ambos os temas, incluindo hover, active, selected, opacidades e gradientes; corrigir combinações abaixo dos limiares da spec.
- [x] 4.3 Inspecionar todas as páginas migradas em desktop e 320 px, com teclado e movimento reduzido; registrar evidências de legibilidade, foco, overlays e estados loading/erro/vazio/sucesso aplicáveis sem regressões de layout ou interação.
- [x] 4.4 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build e confirmar aprovação; testes de banco usam MySQL real isolado e falhas de configuração permanecem explícitas.

## 5. Conclusão do apply

- [x] 5.1 Revisar requisitos e atualizar tasks.md final com evidências das verificações; confirmar que todos os grupos foram migrados e alterações preexistentes permanecem preservadas.
- [x] 5.2 Adicionar somente arquivos/hunks desta mudança, incluindo tasks.md final, revisar diff staged e executar git diff --cached --check; criar exatamente um commit no formato [update] descrição objetiva se houver novo diff e todas as verificações aprovadas, depois confirmar hash e arquivos incluídos, sem tag, push ou archive.

## Evidências

Ver `verification.md` para contraste, rotas/estados inspecionados, preservação do Git e checks aprovados.
