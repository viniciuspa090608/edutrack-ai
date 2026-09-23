# Proposal

## Why

A aplicação abre hoje em uma página de diagnóstico da fundação técnica. Ela ainda não apresenta a EduTrack a visitantes nem oferece um caminho claro para quem deseja acessar a plataforma. Uma landing pública permite comunicar o produto antes da implementação dos módulos e da autenticação.

## What Changes

- Exibir em `/` uma landing mobile-first da EduTrack com apresentação dos recursos planejados, seção de tecnologias e convite para cadastro.
- Adicionar header fixo com navegação por seções no desktop e menu hambúrguer acessível no mobile. A ação **Login / Inscreva-se** permanece visível nos dois formatos.
- Adicionar carrossel automático de slides minimalistas, cada um com imagem e descrição breve de uma funcionalidade, com controles manuais e respeito à preferência por movimento reduzido.
- Direcionar a ação de acesso a uma página provisória **Em breve**, já que login e cadastro pertencem a outra mudança.
- Manter o diagnóstico técnico existente acessível em `/status`, sem fazer a landing depender da disponibilidade da API.

## Capabilities

### New Capabilities

- `public-landing`: apresentação pública, navegação responsiva, carrossel e destino provisório da chamada de acesso.

### Modified Capabilities

Nenhuma capability publicada em `openspec/specs/` será modificada; atualmente não há specs principais. A mudança desloca a página técnica do caminho inicial para `/status`, o que exige reconciliar a spec ainda não sincronizada de `bootstrap-study-platform` antes do arquivamento das duas mudanças.

## Impact

- `apps/web`: composição da página, estilos, imagens locais, metadados e testes de interação; preservação da tela de estado da API em `/status`.
- Dependência nova `lucide-react` para ícones de interface. Não há alteração na API, no banco, nos contratos compartilhados ou em autenticação.
- Risco de comunicar como disponíveis recursos ainda planejados: textos devem descrever a proposta da plataforma sem prometer uso imediato. Critérios de aceite incluem navegação utilizável a 320 px, teclado, movimento reduzido, avanço automático e destino funcional da ação de acesso.
