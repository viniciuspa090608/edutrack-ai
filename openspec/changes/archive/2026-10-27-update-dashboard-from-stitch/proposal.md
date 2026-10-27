# Proposal

## Why

O dashboard autenticado em `/app` reúne dados reais, mas apresenta seis cards com hierarquia limitada e métricas semanais somente textuais. O export do Stitch oferece referências desktop/mobile e claro/escuro para tornar a leitura mais clara sem alterar funcionalidades ou contratos.

## What Changes

- Reorganizar saudação, resumos, tarefas, matéria destacada, foco, revisões e estatísticas em uma composição responsiva inspirada no Stitch.
- Apresentar visualmente progresso oficial de tarefas e matéria; acrescentar gráfico semanal derivado exclusivamente de `week.data.series`, preservando todas as métricas e avisos atualmente exibidos.
- Reutilizar primitives Shadcn, tokens e tema global; manter o shell autenticado e as chamadas existentes.
- Adaptar estados preenchidos, vazios, loading e erros parciais; manter preferências, recarga, links contextuais e início seguro de Pomodoro.
- Substituir elementos fictícios do export por informação disponível, sem XP, metas inventadas, previsão de notas, notificações ou busca global.

## Capabilities

### New Capabilities

- `dashboard-presentation`: apresentação responsiva dos resumos atuais e séries semanais reais, com estados acessíveis e consistência entre temas.

### Modified Capabilities

Nenhuma. `user-dashboard` existe nos artefatos de `compose-user-dashboard`, ainda não sincronizados à base principal; seus requisitos funcionais são preservados, não duplicados nem modificados por esta mudança.

## Impact

Somente `apps/web/src/features/dashboard`, seu CSS e testes afetados. Componentes locais de apresentação poderão ser extraídos sem nova arquitetura. Sem alterações em API, backend, contratos, banco, dependências ou outras páginas. Alterações preexistentes da landing e do tema permanecem fora desta mudança. A validação do apply executará somente testes da UI afetada, conforme instrução específica do usuário, além de verificações estáticas/build da web; não executará suítes completas ou testes de backend.
