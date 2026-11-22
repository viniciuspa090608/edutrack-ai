## ADDED Requirements

### Requirement: Relatório consistente com nove conquistas
O relatório unificado imprimível e salvável em PDF SHALL refletir o catálogo de nove conquistas e os mesmos critérios, progresso e datas da interface para a conta autenticada. As duas novas conquistas SHALL aparecer na seção de conquistas obtidas quando concedidas, preservando a regra existente de não listar bloqueadas nessa seção. Totais e denominadores apresentados SHALL considerar nove, sem valores fixos do catálogo anterior. SHALL preservar A4, tema claro, duas colunas, ordem Progresso antes de Estatísticas e conteúdo completo em múltiplas páginas.

#### Scenario: Novas conquistas obtidas
- **WHEN** a pessoa imprime com “Quatorze dias seguidos” e “Revisão dedicada” obtidas
- **THEN** ambas aparecem com critério, progresso e data corretos e o total considera nove conquistas.

#### Scenario: Conquistas bloqueadas e várias páginas
- **WHEN** apenas parte do catálogo está obtida ou a lista obtida excede uma página
- **THEN** o PDF mantém os totais corretos e apenas as obtidas na seção correspondente, sem cortes ou cards ocultos.
