# Componentes visuais

`@study-platform/ui` é a fonte dos componentes Shadcn UI compartilhados. A web mantém componentes de domínio em `features/*` e os compõe com os primitives deste pacote. Não criar uma segunda pasta de primitives na aplicação.

## Consumo

```tsx
import { Button } from '@study-platform/ui/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
} from '@study-platform/ui/components/ui/card';

function TaskCard() {
  return (
    <Card>
      <CardHeader>
        <h2>Próxima tarefa</h2>
      </CardHeader>
      <CardContent>
        <Button>Concluir</Button>
      </CardContent>
    </Card>
  );
}
```

A entrada web importa `@study-platform/ui/globals.css` uma única vez. Tokens de cores, superfícies, foco, overlays, gráficos e radius vivem em `src/styles/globals.css`. Ajustar aparência por tokens e variants; usar classes nas features para layout, espaçamento, dimensões e conteúdo. A identidade azul e neutra utiliza temas claro e escuro centralizados nessa fonte. A web acompanha a preferência do sistema antes de renderizar React e atualiza a classe `.dark` no documento sem remontar telas.

## Adicionar componentes

Verificar primeiro o catálogo oficial Shadcn e os componentes já existentes neste pacote. Adicionar apenas quando houver consumidor concreto. A configuração usa o estilo `new-york`, primitives Radix, Lucide, TSX e CSS variables; não usar scaffold de novo monorepo, RSC ou mudar implicitamente para Base UI.

Executar da raiz:

```powershell
npx --yes shadcn@4.21.1 add tooltip -c packages/ui -y
pnpm --filter @study-platform/ui normalize:shadcn
pnpm --filter @study-platform/ui remove cn
pnpm --filter @study-platform/ui build
pnpm --filter @study-platform/web typecheck
```

O comando de geração deve operar em `packages/ui`, onde o alias `@/` aponta para `src`. Os exports públicos apontam para `dist` porque o pacote é compilado. Gerar pela web pode fazer o CLI resolver os exports como destino de saída e escrever em `dist`.

O CLI 4.21.1 gera imports do pacote `cn`. O normalizador troca esses imports pelo utilitário local `src/lib/utils.ts` e normaliza imports internos para caminhos relativos com `.js`, exigidos pelo NodeNext. Se a geração adicionou `cn`, removê-lo após normalizar; não remover `clsx`, `tailwind-merge` ou `class-variance-authority`, usados pelos componentes. Conferir o diff gerado, dependências, peers de React/ReactDOM e todas as verificações do projeto.

## Composições e comportamento

- `Card` aceita `asChild` para manter semântica de `section`, `article`, `li` ou `form`; headers e conteúdo são compostos com CardHeader/CardContent.
- `Select` fornece a composição Radix. `NativeSelect` é a alternativa oficial Shadcn para seletores que precisam preservar opções vazias, validação nativa e handlers DOM.
- `Field`, `FieldSet`, `FieldLegend` e `Label` organizam formulários sem obrigar a substituição do estado ou da validação existente.
- `Dialog` atende edição; `AlertDialog` atende confirmações. Usar estado controlado e Button quando a confirmação é assíncrona, para manter erro visível e evitar fechamento antecipado ou submissão duplicada.
- `Progress` recebe valor e máximo reais, com nome acessível. Texto, arredondamentos e cálculo de domínio ficam na feature.
- Erros bloqueantes permanecem em Alert; não substituí-los por avisos transitórios. Sonner só deverá ser adicionado quando houver fluxo concreto de toast.

Wrappers só se justificam por regra de negócio, comportamento compartilhado ou configuração repetida relevante. Um wrapper que apenas renomeia Button ou Card não agrega valor. Antes de remover um componente ou dependência, buscar todos os consumidores no monorepo.

## Tokens de identidade e estado

Use `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground` e equivalentes, ou `var(--token)` em CSS. Cada superfície colorida usa seu par foreground. Texto secundário usa muted-foreground; ações e links usam primary; foco usa ring. Não definir hex, cores arbitrárias ou classes de escala nas features.

| Token                  | Claro   | Escuro  |
| ---------------------- | ------- | ------- |
| background             | #f8f9fa | #212529 |
| foreground             | #212529 | #f8f9fa |
| card                   | #e9ecef | #343a40 |
| card-foreground        | #212529 | #f8f9fa |
| popover                | #f8f9fa | #343a40 |
| popover-foreground     | #212529 | #f8f9fa |
| primary                | #023e8a | #48cae4 |
| primary-foreground     | #f8f9fa | #212529 |
| secondary              | #e9ecef | #495057 |
| secondary-foreground   | #495057 | #f8f9fa |
| muted                  | #e9ecef | #343a40 |
| muted-foreground       | #495057 | #adb5bd |
| accent                 | #caf0f8 | #023e8a |
| accent-foreground      | #03045e | #caf0f8 |
| destructive            | #9b2525 | #f19c9c |
| destructive-foreground | #f8f9fa | #212529 |
| success                | #287052 | #9ed1b7 |
| success-foreground     | #f8f9fa | #212529 |
| warning                | #805214 | #dfb878 |
| warning-foreground     | #f8f9fa | #212529 |
| info                   | #023e8a | #90e0ef |
| info-foreground        | #f8f9fa | #212529 |
| overlay                | #212529 | #212529 |
| border                 | #ced4da | #6c757d |
| input                  | #6c757d | #adb5bd |
| ring                   | #0077b6 | #90e0ef |
| chart-1                | #023e8a | #48cae4 |
| chart-2                | #0077b6 | #90e0ef |
| chart-3                | #495057 | #adb5bd |

Success, warning, destructive e info mantêm o significado de estado e exigem texto ou indicador acessível. Variantes Alert oferecem esses estados em superfície card; ações destrutivas usam destructive-foreground. Border separa superfícies; input identifica campos ativos; ring fornece foco opaco com afastamento. chart-1/2/3 são cores informativas por tema, sem alterar métricas ou legendas.

As quatro ilustrações SVG externas da landing são assets decorativos isolados: usam literais da paleta azul/neutra porque arquivos carregados via img não herdam as variáveis CSS da página. Mantêm uma prancheta clara autocontida, legível também no tema escuro, preservando forma e alternativa textual. Essa exceção não se aplica a componentes, gráficos de dados ou CSS das páginas.
