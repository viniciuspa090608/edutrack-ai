# Design

## Context

`FlashcardsPage` concentra a lista e o gerenciamento de baralhos. `ReviewQueue` hoje abre uma lista paginada de cartões pendentes e exige a escolha de um cartão para começar. O servidor já mantém o agendamento e o histórico em separado. Veja [proposal.md](proposal.md).

## Goals / Non-Goals

- Usar a composição interna do Anki Desktop nas três telas, dentro do `AuthenticatedShell` do EduTrack.
- Manter a política de agendamento, a consulta manual e o histórico existentes. O escopo visual abrange as telas de estudo pedidas.

## Decisions

### 1. Baralhos

```text
Navegação autenticada do EduTrack

Baralhos                                              [Novo baralho]
Matéria [ Todas as matérias ▾ ]          [Ver estudo desta matéria]*
────────────────────────────────────────────────────────────────────
Baralho · Matéria             Novos   Em aprendizagem   Para revisão
Citologia · Biologia            12           2                4
Genética · Biologia              4           0                3
Vocabulário                      2           1                0
────────────────────────────────────────────────────────────────────
                         [Anterior]   [Próxima]

* Ação disponível quando uma matéria é selecionada.
```

- **Anki Desktop** — linhas compactas, nome acionável à esquerda e três colunas numéricas com os cabeçalhos acima. O nome abre a visão do baralho. [Decks](https://docs.ankiweb.net/manual/studying#decks)
- **EduTrack** — matéria junto ao nome com `SubjectName`, filtro rotulado com `Select` e `Label`, lista com `Table` e navegação com `Button` e `Pagination`. Preservar a ação de criar e mover as ações de gerenciamento do baralho para a visão de detalhe. Em telas estreitas, cada linha mostra nome e matéria primeiro e as três contagens rotuladas abaixo, mantendo a ordem. Distinguir lista vazia de filtro sem resultados.

### 2. Visão do baralho ou da matéria

```text
Navegação autenticada do EduTrack

[‹ Baralhos]
                        Citologia
                         Biologia

            Novos                12
            Em aprendizagem       2     [Estudar agora]
            Para revisão          4

               Gerenciar baralho e cartões
```

- **Anki Desktop** — título em destaque no centro, resumo vertical compacto logo abaixo e ação principal à direita dos contadores. Em telas estreitas, a ação fica abaixo do resumo. [Study Overview](https://docs.ankiweb.net/manual/studying#study-overview)
- **EduTrack** — `Button` primário para estudar, padrão de retorno do módulo e estilos de títulos existentes. A visão por matéria usa a mesma composição, com a matéria no título e a lista dos baralhos vinculados como conteúdo secundário abaixo da ação. As ações de gerenciamento e consulta manual ficam em uma seção secundária na visão do baralho. Com fila vazia, apresentar uma mensagem no espaço da ação.

### 3. Revisão

```text
Navegação autenticada do EduTrack

[‹ Voltar ao resumo]   Citologia    [Ver histórico]
┌──────────────────────────────────────────────────┐
│                                                  │
│         Qual é a função dos ribossomos?          │
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│                [Mostrar resposta]                │
└──────────────────────────────────────────────────┘

Após revelar
┌──────────────────────────────────────────────────┐
│         Qual é a função dos ribossomos?          │
│                 ────────────────                 │
│              Sintetizar proteínas.              │
│                                                  │
├──────────────────────────────────────────────────┤
│   10 min      1 dia       3 dias       5 dias    │
│ [De novo]    [Difícil]     [Bom]       [Fácil]    │
└──────────────────────────────────────────────────┘

Área inferior em largura estreita
┌──────────────────────┐
│   10 min      1 dia  │
│ [De novo]  [Difícil] │
│   3 dias     5 dias  │
│   [Bom]     [Fácil]  │
└──────────────────────┘
```

- **Anki Desktop** — área de leitura central com a pergunta em evidência, ação de revelar na faixa inferior e quatro avaliações alinhadas na mesma faixa após revelar. A pergunta permanece acima do divisor e a resposta aparece abaixo. [Questions](https://docs.ankiweb.net/manual/studying#questions) · [Answer Buttons](https://docs.ankiweb.net/manual/studying#answer-buttons)
- **EduTrack** — usar `Separator` entre os lados, `Button` para revelar, avaliar e retornar, `ReviewHistory` para o histórico e `Skeleton` e `Alert` nos estados de carregamento e erro. Usar a tipografia e a escala de espaçamento existentes, `--background`, `--foreground`, `--border`, `--radius` e o foco com `--ring`. Aplicar `info`, `warning` e `success` aos contadores **Novos**, **Em aprendizagem** e **Para revisão**. Aplicar `destructive`, `warning`, `success` e `info` às avaliações, com os tokens de texto correspondentes e rótulos visíveis. Conferir contraste nos dois temas.
- Com conteúdo curto, manter a faixa de ações na base da área de estudo. Com conteúdo longo, deixá-la no fluxo abaixo do texto, sem sobreposição. Usar quatro colunas quando houver espaço e grade 2 × 2 a partir de 320 px quando a linha única ficar apertada, com alvos de toque de pelo menos 44 px. Associar cada intervalo ao botão para leitores de tela. Manter foco visível, ordem de tabulação coerente e anúncios de revelação, confirmação e fim de fila.

### 4. Fonte da fila e da prévia

A API usa os mesmos critérios de pendência para consultar a fila e contar seus estados. Usa o estado persistido da política para distinguir intervalo zero, intervalo positivo sem consolidação e cartão consolidado. Agrega contagens por baralho em lote e por matéria em todo o escopo, com filtro de usuário e validação das preferências. Reutiliza o vínculo do baralho com a matéria e a interface pública de validação de matérias. Isso mantém os números independentes da paginação e evita uma consulta por linha.

O serviço de revisão usa a política registrada do cartão para calcular os quatro intervalos em segundos, sem persistência. A interface localiza a duração e associa cada valor à respectiva avaliação. A confirmação continua usando a revisão esperada e a chave de idempotência do fluxo atual. Após confirmação, atualizar contagens e consultar o próximo pendente do mesmo escopo em ordem de vencimento, com desempate por ID. O próximo cartão começa com a resposta oculta e a próxima data confirmada é anunciada. Ao esgotar a fila, mostrar o estado de conclusão com retorno ao resumo.

## Risks / Trade-offs

- Alterações simultâneas de agendamento ou de vínculo podem deixar o resumo desatualizado. Revalidar o escopo ao carregar o próximo cartão, atualizar as contagens após mudanças e recuperar conflitos sem duplicar avaliações.
- Uma falha de rede pode ocorrer depois de a avaliação ter sido registrada. Repetir o mesmo envio com a chave original e avançar só após confirmação.
- Nomes longos, perguntas extensas e rótulos móveis disputam espaço. Permitir quebra de linha e conferir as três telas a 320 px e no desktop.

## Migration Plan

Publicar a API e a interface juntas, pois o cliente anterior valida as respostas com schemas estritos. Os estados de agendamento existentes fornecem os dados da classificação e da prévia.
