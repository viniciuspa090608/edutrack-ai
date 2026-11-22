# Proposal

## Why

As sugestões do assistente precisam orientar melhor o uso cotidiano e a descoberta do aplicativo. A importação Classroom precisa comunicar seu andamento e funcionar durante o primeiro acesso, pois há relato de que só funciona pela aba Conta; conquistas e relatório PDF também precisam evoluir juntos.

## What Changes

- Substituir a sugestão de tarefas por “Quais tarefas devo fazer?” e adicionar “Me ensine a usar o aplicativo”, com respostas compatíveis com as funcionalidades reais.
- Ampliar de sete para nove conquistas. Propor “Quatorze dias seguidos” (14 datas ativas consecutivas) e “Revisão dedicada” (100 avaliações confirmadas de flashcards), reutilizando atividades já rastreadas.
- Atualizar o relatório imprimível/salvável em PDF com o catálogo ampliado, contagens e conquistas obtidas, preservando sua apresentação existente.
- Mostrar barra de progresso real durante a importação e toast ao finalizar, distinguindo sucesso, parcial e falha.
- Corrigir o fluxo de importação no onboarding de contas novas, incluindo retorno OAuth, preferências e recuperação da operação, sem exigir passagem pela aba Conta.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `ai-study-assistant`: sugestões de tarefas e ajuda contextual sobre o aplicativo.
- `study-achievements`: catálogo com nove conquistas e critérios verificáveis.
- `study-report-printing`: consistência do relatório PDF com o catálogo ampliado.
- `google-classroom-integration`: feedback de progresso e conclusão e importação funcional no onboarding.

## Impact

Web: AssistantPage, OnboardingGate, ClassroomSection, apresentação de conquistas e relatório unificado. Contratos: catálogo, enum e validação hoje fixa em sete conquistas. API: projeção de progresso, orientação do assistente e integração Classroom conforme causa reproduzida. Testes de contratos, projeção, interface e integração, com MySQL isolado quando necessário. Sem novos provedores ou permissões Google; callbacks autorizados e portas atuais permanecem preservados.
