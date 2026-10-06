# Design

## Context

Ver `proposal.md` para motivação e limites. A mudança cruza componentes compartilhados e várias telas apenas na apresentação, justificando este desenho curto.

- `FlashcardsPage.tsx` usa grid no container e renderiza ações principais como filhos separados; já existe `.flashcard-actions` com flex e wrap para ações dos cartões. Os painéis condicionais estão intercalados com botões.
- O Checkbox compartilhado é um botão Radix com `size-4 shrink-0`. `account.css` impõe `min-height: 40px`, `height: auto` e padding vertical a todos os botões da Conta, distorcendo esse controle. As regras antigas para inputs checkbox em `auth.css` não atingem o botão Radix.
- Os consumidores de Pagination montam botões próprios. Existem paginações em Flashcards, revisão/histórico/IA, Matérias/roadmaps/revisões, Tarefas, Rotinas e Pomodoro. As condições de disabled e handlers já estão nos consumidores. O componente UI também exporta anterior/próximo como links, embora as telas inspecionadas usem botões.
- Os cinco pontos de declaração de `type="password"` usam o Input compartilhado: AccessPage (login e cadastro), PasswordRecoveryPage, e três campos de ProfilePage (confirmação de identidade, senha atual e nova senha). Não existem campos de confirmação de senha nesses fluxos.
- Lucide é o conjunto de ícones atual. Não foi encontrada configuração de Font Awesome nos locais inspecionados; os dois ícones de senha exigidos serão assets oficiais locais com atribuição/licença preservada.

## Goals / Non-Goals

**Goals:** alterações pequenas nos componentes e CSS existentes; reutilização do controle de senha e dos ícones direcionais; preservação de handlers, refs e atributos.

**Non-Goals:** novo sistema de formulários ou paginação, novos campos de confirmação, novas regras ou rotas, refatorações de módulos, mudanças de backend e dependência completa de ícones para apenas dois SVGs.

## Decisions

1. **Flashcards:** envolver os grupos de ações principais e do baralho aberto com o padrão `.flashcard-actions`; preservar os painéis condicionais fora da linha de botões e a ordem lógica de interação. Usar flex-wrap, espaçamento existente, flex-shrink adequado e largura máxima. Não forçar nowrap do container, que produziria overflow. Reutilizar os breakpoints atuais quando necessários; permitir quebra pelo espaço disponível, sem inventar breakpoint. Textos longos devem poder caber em 320 px sem mutilação.
2. **Checkbox:** corrigir o seletor de botão genérico da Conta para excluir `[data-slot='checkbox']` e, somente se necessário, fixar dimensões/aspecto na preferência. Preservar o componente Radix e seus estados/foco em vez de substituí-lo ou mudar sua lógica. Validar a cascata, incluindo os estilos antigos de `auth.css`.
3. **Paginação:** substituir apenas conteúdos direcionais por ChevronLeft/ChevronRight do Lucide, com aria-label preservando os nomes atuais (inclusive nomes contextuais). Reutilizar uma pequena extensão visual do componente de paginação, se evitar repetição, sem mover estado ou cálculo de páginas. Manter botões nativos disabled e suas condições existentes. Links exportados, se alterados, precisam impedir ativação e remover alcance por teclado quando indisponíveis. Não alterar botões de progressão de fluxo, como `Próximo cartão`.
4. **Senha:** estender o Input apenas no ramo explicitamente `type="password"`, isolando estado em um controle reutilizável para garantir ocultação inicial e não afetar inputs comuns. O wrapper deve manter data-slot, className, ref, atributos nativos, valor e onChange do input; reservar espaço interno para botão de olho e usar os tokens visuais existentes. O toggle será `type="button"`, acessível por teclado, desabilitado junto do input e com aria-label e ícone dependentes da visibilidade. Preservar seleção/foco por ref e restauração após alternar o tipo, sem tomar foco em renders comuns; ao clicar com ponteiro, evitar perda desnecessária do foco do input. Não converter campos de códigos ou OTPs para password.
5. **Ícones de senha:** incorporar apenas os SVGs oficiais eye e eye-slash do Font Awesome com `currentColor`, aria-hidden e atribuição/licença, sem CDN em tempo de execução. Alternativa de biblioteca inteira aumenta dependências desnecessariamente; Lucide permanece para paginação, conforme preferência do pedido.
6. **Verificação:** executar somente os arquivos de testes UI diretamente afetados ou casos filtrados de paginação/senha/checkbox dentro deles. Adicionar testes de interação úteis para senha e exclusões, aproveitar testes existentes de navegação e limites. Verificar geometria/overflow, foco e temas em navegador: jsdom não mede layout real. Nenhuma suíte completa, testes API/banco ou testes de módulos não relacionados. Registrar comandos e resultados sem apresentar inspeção estática como validação visual. Checagens de lint/tipos podem ser limitadas ao frontend e pacote UI alterado.

## Risks / Trade-offs

- [CSS abrangente na Conta ou autenticação interfere no olho e checkbox] → verificar estilos computados e usar seletores locais; evitar modificar regras globais de botões sem necessidade.
- [Wrapper de Input altera seletores de filhos diretos e referências] → manter props/ref no input e revisar apenas os seletores das telas afetadas; testar validação, envio, disabled e foco.
- [Alterar texto quebra nomes usados pelos testes e leitores de tela] → manter nomes existentes como aria-label e ocultar SVGs da árvore acessível.
- [Não há confirmação de senha em alguns fluxos] → contemplar somente campos existentes, conforme o pedido; não adicionar confirmação.
- [jsdom não valida responsividade] → verificar no navegador largura de 320 px, breakpoint existente e desktop, temas claro/escuro, controles longos e overflow do documento e containers.

## Migration Plan

Não exige migração de dados nem alteração de configuração de servidor. O apply registra estado Git, conclui verificações específicas e cria um commit único com arquivos da mudança e tarefas finais após revisão staged e `git diff --cached --check`. Reversão consiste em reverter esse commit. Publicação, push, tags e arquivamento são ações separadas.
