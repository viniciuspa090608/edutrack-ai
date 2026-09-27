import { OpenAIStructuredProvider } from '../../shared/openai-structured-provider.js';
import { roadmapContentSchema, suffixSchema } from '@study-platform/contracts';
import type { RoadmapParameters } from '@study-platform/contracts';
import type { ApiEnv } from '../../config/env.js';

export interface RoadmapProvider {
  generate(
    subjectName: string,
    parameters: RoadmapParameters,
  ): Promise<unknown>;
  regenerate(context: unknown): Promise<unknown>;
}
export class OpenAIRoadmapProvider implements RoadmapProvider {
  constructor(
    private readonly env: ApiEnv,
    private readonly request: typeof fetch = fetch,
  ) {}
  async generate(
    subjectName: string,
    parameters: RoadmapParameters,
  ): Promise<unknown> {
    return new OpenAIStructuredProvider(this.env, this.request).structured(
      { subjectName, parameters },
      roadmapContentSchema,
      'subject_roadmap',
      'Crie um roadmap de estudo em português organizado em blocos e passos. Adeque a progressão ao nível, objetivo, prazo, horas semanais e assuntos conhecidos.',
    );
  }
  regenerate(context: unknown): Promise<unknown> {
    return new OpenAIStructuredProvider(this.env, this.request).structured(
      context,
      suffixSchema,
      'roadmap_suffix',
      'Crie somente a continuação posterior à âncora do roadmap, em português. Preserve conceitualmente o prefixo; não repita seus títulos nem conceitos já conhecidos. Use o sufixo anterior e o objetivo como contexto, respeitando a ordem revisada. Retorne passos com título e descrição.',
    );
  }
}
