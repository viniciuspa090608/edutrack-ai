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

A entrada web importa `@study-platform/ui/globals.css` uma única vez. Tokens de cores, superfícies, foco, overlays, gráficos e radius vivem em `src/styles/globals.css`. Ajustar aparência por tokens e variants; usar classes nas features para layout, espaçamento, dimensões e conteúdo. A futura mudança `update-application-theme` poderá alterar essa fonte sem procurar cores nas páginas.

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
