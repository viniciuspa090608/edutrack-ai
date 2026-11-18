# Verificação da implementação

## Estado inicial

- Branch inicial: master; HEAD: 715aae6f02718d7be1f45aaa8b8f97ba626e5bd1.
- Somente a proposta desta mudança estava sem versionamento; nenhum diff de código preexistente.
- Implementação na branch codex/refine-study-interface-and-unified-report; sem push.

## Evidências funcionais

- MySQL real, bancos isolados criados e removidos pelos testes: dez testes de subjects.http.spec.ts aprovados, incluindo resumos manual/roadmap, zero/nulo, mutação, paginação, filtros, acesso entre contas e número constante de consultas ao aumentar a página.
- Navegador Edge headless com componentes e estilos reais, usando respostas controladas somente no harness local de QA: filtros alinhados, input maior, detalhes exclusivos, retorno/foco, desktop e 320 px em claro/escuro, teclado, rolagem local, cronômetro ativo, módulos desativados e falha parcial.
- Medidas desktop: Pomodoro 264 → 216 px; Flashcards 232 → 280 px; Tarefas/altura conjunta 516 px preservada. Dois baralhos completos visíveis antes da rolagem, anteriormente um. Com cronômetro ativo a soma das duas alturas permanece 496 px mais o gap de 20 px.
- Resumo extenso de disciplina: área útil 128 px, conteúdo 267 px e scrollTop 139 px ao chegar ao fim por teclado, com rodapé externo.
- Sete conquistas concedidas exibidas, gap computado 4 px, mapeamento por código compartilhado com o mural.
- PDFs gerados por Progresso e Estatísticas com sete conquistas, seis métricas e trinta amostras diárias: texto extraído idêntico, seis páginas A4, Progresso e conquistas antes de Estatísticas, logo do favicon, paleta clara e paginação contínua. Todas as páginas revisadas em PNG e escala de cinza, sem cortes ou sobreposição; tabela inicia com seu cabeçalho e linhas.
- Harness temporário removido. Evidências locais em .openspec-local/qa, ignoradas pelo Git.

## Verificações do repositório

pnpm lint, pnpm typecheck, pnpm test e pnpm build aprovados. A suíte completa contém 22 testes do workflow, 42 de contratos, 284 da API e 298 da web (646 no total). O finalizador repete obrigatoriamente os quatro checks antes do commit. O build emite somente o aviso já existente sobre tamanho do bundle.

## Revisão das specs

Seis snapshots preparados em .openspec-local/reviewed/refine-study-interface-and-unified-report. Preservados propósitos, requisitos não envolvidos e cenários existentes. Atualizadas explicitamente a antiga centralização do botão Pomodoro, a impressão restrita à aba e a restrição genérica de contrato visual para permitir o novo resumo oficial de disciplinas.
