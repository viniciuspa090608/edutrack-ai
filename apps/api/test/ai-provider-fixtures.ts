import type { AIProvider } from '@study-platform/contracts';

export function providerEnvelope(provider: AIProvider, value: unknown) {
  const text = JSON.stringify(value);
  switch (provider) {
    case 'gemini':
      return {
        candidates: [{ finishReason: 'STOP', content: { parts: [{ text }] } }],
      };
    case 'claude':
      return { stop_reason: 'end_turn', content: [{ type: 'text', text }] };
    case 'kimi':
      return {
        choices: [{ finish_reason: 'stop', message: { content: text } }],
      };
    default:
      return {
        status: 'completed',
        output: [{ type: 'message', content: [{ type: 'output_text', text }] }],
      };
  }
}
export const roadmapFixture = {
  title: 'Plano',
  description: 'Estudo',
  blocks: [
    {
      title: 'Base',
      description: 'Conceitos',
      steps: [
        { title: 'Ler', description: 'Aprender' },
        { title: 'Praticar', description: 'Exercitar' },
        { title: 'Revisar', description: 'Fixar' },
      ],
    },
  ],
};
export const suffixFixture = {
  steps: [{ title: 'Nova etapa', description: 'Estudar continuação' }],
};
export const flashcardFixture = {
  cards: [{ front: 'Pergunta', back: 'Resposta' }],
};
