import type { AccountStructuredProvider } from '../../shared/structured-provider.js';
import { roadmapContentSchema, suffixSchema } from '@study-platform/contracts';
import type { RoadmapParameters } from '@study-platform/contracts';

export interface RoadmapProvider {
  generate(
    userId: string,
    subjectName: string,
    parameters: RoadmapParameters,
  ): Promise<unknown>;
  regenerate(userId: string, context: unknown): Promise<unknown>;
}
export class AccountRoadmapProvider implements RoadmapProvider {
  constructor(private readonly provider: AccountStructuredProvider) {}
  async generate(
    userId: string,
    subjectName: string,
    parameters: RoadmapParameters,
  ): Promise<unknown> {
    return this.provider.structured(
      userId,
      { subjectName, parameters },
      roadmapContentSchema,
      'subject_roadmap',
      'Crie um roadmap de estudo em português organizado em blocos e passos. Adeque a progressão ao nível, objetivo, prazo, horas semanais e assuntos conhecidos.',
    );
  }
  regenerate(userId: string, context: unknown): Promise<unknown> {
    return this.provider.structured(
      userId,
      context,
      suffixSchema,
      'roadmap_suffix',
      'Crie somente a continuação posterior à âncora do roadmap, em português. Preserve conceitualmente o prefixo; não repita seus títulos nem conceitos já conhecidos. Use o sufixo anterior e o objetivo como contexto, respeitando a ordem revisada. Retorne passos com título e descrição.',
    );
  }
}
