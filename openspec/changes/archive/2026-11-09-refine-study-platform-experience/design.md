# Design

## Context

A Home tem regras de altura estável e a programação semanal usa uma grade. Tarefas já oferece filtros com envio explícito e uma operação transacional para concluir subtarefas. O perfil já persiste e valida o nome de exibição, enquanto o cadastro local cria a conta e o contexto de confirmação em uma transação.

## Goals / Non-Goals

- Reutilizar componentes, tokens e operações existentes, com suporte a ambos os temas, teclado e largura de 320 px.
- Manter o nome de exibição editável e o e-mail como identificador de acesso local. Um identificador público único e novas formas de login ficam fora do escopo.

## Decisions

- Em Flashcards, usar a barra existente com quebra responsiva para o seletor de matéria e as duas ações. Reutilizar o padrão de estado vazio de Tarefas e revisar o alinhamento do componente em Matérias com estilos locais onde necessário.
- Aplicar o padrão expansível aos painéis com múltiplos filtros, inclusive o de status, importância e prazos em Tarefas. Inventariar os painéis já existentes em Matérias e outros módulos. Separar valores em edição dos aplicados. A consulta de Estatísticas mantém seu envio explícito e a seleção isolada de Flashcards continua junto às ações.
- Em Perfil, preservar os controles reais de foto, nome e segurança. Usar uma grade compacta para o campo e a ação Salvar nome, e os estados já retornados pelo Classroom para montar o badge. Ocultar a legenda de IA com a técnica de texto visualmente oculto.
- Na Home, deixar Matérias, Progresso e Estatísticas crescerem com o conteúdo. Manter o contêiner rolável de Tarefas e derivar o efeito das bordas da posição da lista e de suas dimensões. Usar o fundo do card e respeitar a preferência por movimento reduzido.
- Identificar avisos informativos disparados por ações e aplicar uma política compartilhada de expiração de 6 segundos. Cancelar o temporizador ao substituir o aviso ou desmontar o componente. Manter as mensagens necessárias para recuperação e validação.
- Na lista de Tarefas, reutilizar a edição de status para tarefas sem subtarefas e a confirmação e operação em lote existentes para as demais. A caixa reflete a resposta confirmada. Atualizar lista, detalhes e filtros após sucesso e manter o estado anterior em cancelamento ou falha. A caixa oferece conclusão rápida e a reabertura segue os fluxos atuais.
- Adicionar o nome opcional ao contrato de registro com a validação do perfil e aproveitar a persistência de nome existente dentro da transação de cadastro. O formulário omite o campo em branco e a API mantém o nome padrão para clientes antigos. Preservar a confirmação de e-mail e a entrada por Google.

## Risks / Trade-offs

- Um resultado filtrado pode parecer ausência total de registros. Distinguir resultados vazios, carregamento e falha com dados confirmados.
- A tarefa pode ganhar subtarefas enquanto a lista está aberta. Manter a validação do servidor e apresentar o fluxo de confirmação ou recuperação diante de uma resposta de conflito.
- Desfoque e altura automática podem afetar a leitura em telas estreitas. Verificar os extremos da rolagem, o foco, o gráfico e a quebra dos controles em ambos os temas.

## Migration Plan

Usar o campo de nome já persistido. Publicar o contrato e a API compatíveis com o cadastro antigo antes de expor o campo na interface. Se o campo for retirado da interface, os nomes gravados permanecem editáveis no perfil.
