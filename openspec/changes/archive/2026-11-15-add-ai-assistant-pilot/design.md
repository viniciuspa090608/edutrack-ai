## Context

O Edutrack já tem preferência de IA separada dos módulos, configuração pessoal ou Gemini padrão, adaptadores de resposta estruturada, serviços de estudo e reservas MySQL compartilhadas entre instâncias. A navegação privada usa links reais e preserva o shell montado. O worker Classroom fornece uma referência para iniciar processos separados no mesmo deploy. O piloto precisa de agendamento próprio para limpeza, pois seu prazo independe do tráfego.

## Goals / Non-Goals

- Preservar os serviços de domínio como autoridade para leituras e criações e tornar confirmação, retenção e cotas verificáveis em MySQL.
- Usar respostas completas por turno e restringir a superfície do piloto a consultas e criações previstas. Streaming, edição, exclusão e criação de baralhos ficam fora do piloto.

## Decisions

### Acesso e contratos

Usar um gate de implantação para o piloto em conjunto com a preferência existente de IA. Usar a navegação privada para a rota proposta /app/assistente-ia. A API Express aplica sessão, gate, preferências atuais, validação de origem nas mutações e respostas privadas no-store. Separar listagem de conversas, paginação de mensagens, envio e confirmação em contratos Zod de packages/contracts. Iniciar a conversa no primeiro envio persistido evita criar conversas vazias ao abrir a tela.

### Um turno com contexto selecionado antes da chamada

Aplicar resolução local e determinística de consultas e destinos suportados, usando o texto atual, referências recentes autorizadas e seletores fixos. Para prazos relativos, resolver o intervalo civil da conta com começo e fim explícitos. Usar projeções mínimas por operação e consultar via serviços públicos com conta e filtros de módulo. Quando o escopo ou destino não puder ser resolvido com segurança, pedir esclarecimento em vez de enviar uma lista ampla. Evitar um ciclo de ferramentas no provedor, que exigiria chamadas adicionais. Validar a resposta como união de texto, esclarecimento ou proposta. Qualquer destino sugerido pelo modelo precisa corresponder aos candidatos autorizados pelo servidor. Usar orçamento configurável para mensagem, quantidade e volume de contexto recente, projeções de estudo e tamanho da resposta. Histórico exibido e contexto enviado têm limites independentes.

### Recuperação e confirmação

Persistir a mensagem e o estado da tentativa antes da chamada. Usar identificadores estáveis por envio e tentativa para deduplicar retransmissões e bloquear execução concorrente. Retentar explicitamente reutiliza a mensagem e cria uma nova tentativa, sujeita às cotas. Após interrupção, uma tentativa vencida fica recuperável e respostas tardias de tentativas substituídas não alteram o turno.

Guardar prévia imutável vinculada à conta, conversa e mensagem de origem, com expiração no máximo até o vencimento dessa mensagem. Confirmar pelo identificador e pela chave estável emitida pelo servidor. Usar uma transação para bloquear a prévia, validar novamente acesso e alvos e registrar recibo junto com a criação ou lote. Acrescentar entradas transacionais aos serviços públicos onde necessário, reutilizando schemas e regras do domínio. A transação do recibo precisa abranger todas as escritas para suportar falha entre criação e resposta. Repetições autorizadas durante a validade recuperam o resultado persistido. Após expiração, a API recusa a chave antiga. Entidades de estudo independem da retenção de prévias e recibos.

### Capacidade e provedores

Identificar o chat como categoria na reserva de uso existente. Na mesma transação que verifica e incrementa os contadores gerais, verificar os limites diários do chat no padrão compartilhado, por conta e globais, e o máximo de leases simultâneos do chat quando houver concorrência compartilhada suficiente. Se houver apenas um slot global, registrar essa limitação e validar que o piloto preserva orçamento diário e disponibilidade aceitável para os outros fluxos antes de habilitá-lo. Manter o teto diário do chat abaixo dos limites gerais correspondentes. Modo pessoal usa os limites de frequência e concorrência da conta e a cota do próprio provedor. Reutilizar adaptadores estruturados e snapshot da configuração. Liberar combinações do catálogo por matriz de validação do chat, com fixtures para os protocolos e smoke autorizado para cada combinação oferecida no piloto. Cada turno pode consumir no máximo uma chamada, incluindo falhas externas.

### Retenção e operação

Gravar expiração UTC derivada da criação mais 30 dias. Filtrar expiração em cada leitura, listagem e seleção de contexto, com cursor estável por data e ID. Indexar propriedade e paginação, além de expiração para a limpeza. Implementar comando de limpeza pós-build e registrá-lo como tarefa periódica do deploy, independente do flag do chat, com intervalo inicial de até uma hora. Executar lotes transacionais limitados com exclusão concorrente segura e remoção de conversas vazias condicionada à ausência de mensagens sob lock compatível com o envio. O agendamento seguinte retoma pendências após falha. Medir duração, quantidade removida e atraso da limpeza sem conteúdo. Agregar latência, volume, concorrência, chamadas por mensagem, rejeições por limite e crescimento do histórico, sem IDs de conta como dimensões.

## Risks / Trade-offs

- Consultas fora dos seletores reconhecidos exigem esclarecimento. Validar no piloto as perguntas de exemplo e nomes ambíguos antes da abertura.
- Contenção na reserva global pode elevar latência. Manter a transação curta, medir sob carga concorrente e calibrar os tetos.
- Falha de agendamento pode prolongar a permanência física. Verificar idade do backlog e última execução no ambiente implantado, com filtro de expiração independente da rotina.

## Migration Plan

1. Validar migrations e limpeza em MySQL isolado, incluindo replay de confirmação, concorrência e reinício.
2. Aplicar migrations, manter o piloto fechado, configurar limites e agendar o comando pós-build. Verificar execução sem tráfego e continuidade após reinício.
3. Habilitar o piloto com a matriz aprovada e registrar evidências de capacidade. Para recuar, fechar o gate e manter a limpeza e as migrations aplicadas enquanto houver dados sob retenção.

## Open Questions

Os valores dos tetos e limites de contexto, o volume-alvo e a matriz final de combinações liberadas serão preenchidos com dados da hospedagem e dos provedores antes da abertura do piloto.
