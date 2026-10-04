import { FieldSet, FieldLegend } from '@study-platform/ui/components/ui/field';
import { Label } from '@study-platform/ui/components/ui/label';
import { Input } from '@study-platform/ui/components/ui/input';
import { Textarea } from '@study-platform/ui/components/ui/textarea';
import { Button } from '@study-platform/ui/components/ui/button';
import { useEffect, useRef } from 'react';
import type { RoadmapDraft } from '@study-platform/contracts';
const blankStep = () => ({ title: '', description: '' });
export const blankRoadmap = (): RoadmapDraft => ({
  title: '',
  description: '',
  blocks: [{ ...blankStep(), steps: [blankStep()] }],
});
function move<T>(items: T[], index: number, direction: number) {
  const copy = [...items];
  const target = index + direction;
  [copy[index], copy[target]] = [copy[target]!, copy[index]!];
  return copy;
}
export function RoadmapEditor({
  value,
  onChange,
  disabled,
}: {
  value: RoadmapDraft;
  onChange: (value: RoadmapDraft) => void;
  disabled: boolean;
}) {
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  const blockChange = (
    index: number,
    patch: Partial<RoadmapDraft['blocks'][number]>,
  ) =>
    onChange({
      ...value,
      blocks: value.blocks.map((block, i) =>
        i === index ? { ...block, ...patch } : block,
      ),
    });
  const flat = value.blocks.flatMap((block) => block.steps);
  const boundary = flat.reduce(
    (last, step, index) => (step.completed ? index + 1 : last),
    0,
  );
  const offset = (index: number) =>
    value.blocks
      .slice(0, index)
      .reduce((sum, block) => sum + block.steps.length, 0);
  return (
    <FieldSet
      className="roadmap-editor"
      disabled={disabled}
      aria-label="Conteúdo do roadmap"
    >
      <Label>
        Título do roadmap
        <Input
          ref={first}
          required
          maxLength={120}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Label>
      <Label>
        Descrição do roadmap
        <Textarea
          required
          maxLength={1000}
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </Label>
      {value.blocks.map((block, index) => (
        <FieldSet
          className="roadmap-block"
          key={index}
          aria-label={`Bloco ${index + 1}`}
        >
          <FieldLegend>Bloco {index + 1}</FieldLegend>
          <Label>
            Título do bloco {index + 1}
            <Input
              required
              maxLength={120}
              value={block.title}
              readOnly={offset(index) < boundary}
              onChange={(e) => blockChange(index, { title: e.target.value })}
            />
          </Label>
          <Label>
            Descrição do bloco {index + 1}
            <Textarea
              required
              maxLength={1000}
              value={block.description}
              readOnly={offset(index) < boundary}
              onChange={(e) =>
                blockChange(index, { description: e.target.value })
              }
            />
          </Label>
          <div className="subject-actions">
            <Button
              variant="outline"
              type="button"
              disabled={index === 0 || offset(index - 1) < boundary}
              onClick={() =>
                onChange({ ...value, blocks: move(value.blocks, index, -1) })
              }
            >
              Subir bloco {index + 1}
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={
                index === value.blocks.length - 1 || offset(index) < boundary
              }
              onClick={() =>
                onChange({ ...value, blocks: move(value.blocks, index, 1) })
              }
            >
              Descer bloco {index + 1}
            </Button>
            <Button
              variant="ghost"
              className="subject-danger"
              type="button"
              disabled={value.blocks.length === 1 || offset(index) < boundary}
              onClick={() =>
                onChange({
                  ...value,
                  blocks: value.blocks.filter((_, i) => i !== index),
                })
              }
            >
              Excluir bloco {index + 1}
            </Button>
          </div>
          {block.steps.map((step, stepIndex) => (
            <FieldSet
              className="roadmap-step"
              key={step.id ?? stepIndex}
              disabled={offset(index) + stepIndex < boundary}
              aria-label={`Passo ${index + 1}.${stepIndex + 1}`}
            >
              <FieldLegend>
                Passo {index + 1}.{stepIndex + 1}
                {offset(index) + stepIndex < boundary ? ' — preservado' : ''}
              </FieldLegend>
              <Label>
                Título do passo {index + 1}.{stepIndex + 1}
                <Input
                  required
                  maxLength={120}
                  value={step.title}
                  onChange={(e) =>
                    blockChange(index, {
                      steps: block.steps.map((s, i) =>
                        i === stepIndex ? { ...s, title: e.target.value } : s,
                      ),
                    })
                  }
                />
              </Label>
              <Label>
                Descrição do passo {index + 1}.{stepIndex + 1}
                <Textarea
                  required
                  maxLength={1000}
                  value={step.description}
                  onChange={(e) =>
                    blockChange(index, {
                      steps: block.steps.map((s, i) =>
                        i === stepIndex
                          ? { ...s, description: e.target.value }
                          : s,
                      ),
                    })
                  }
                />
              </Label>
              <div className="subject-actions">
                <Button
                  variant="outline"
                  type="button"
                  disabled={
                    stepIndex === 0 || offset(index) + stepIndex - 1 < boundary
                  }
                  onClick={() =>
                    blockChange(index, {
                      steps: move(block.steps, stepIndex, -1),
                    })
                  }
                >
                  Subir passo {index + 1}.{stepIndex + 1}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={stepIndex === block.steps.length - 1}
                  onClick={() =>
                    blockChange(index, {
                      steps: move(block.steps, stepIndex, 1),
                    })
                  }
                >
                  Descer passo {index + 1}.{stepIndex + 1}
                </Button>
                <Button
                  variant="ghost"
                  className="subject-danger"
                  type="button"
                  disabled={block.steps.length === 1}
                  onClick={() =>
                    blockChange(index, {
                      steps: block.steps.filter((_, i) => i !== stepIndex),
                    })
                  }
                >
                  Excluir passo {index + 1}.{stepIndex + 1}
                </Button>
              </div>
            </FieldSet>
          ))}
          <Button
            type="button"
            disabled={
              block.steps.length >= 20 ||
              offset(index) + block.steps.length < boundary
            }
            onClick={() =>
              blockChange(index, { steps: [...block.steps, blankStep()] })
            }
          >
            Adicionar passo ao bloco {index + 1}
          </Button>
        </FieldSet>
      ))}
      <Button
        type="button"
        disabled={value.blocks.length >= 20}
        onClick={() =>
          onChange({
            ...value,
            blocks: [...value.blocks, { ...blankStep(), steps: [blankStep()] }],
          })
        }
      >
        Adicionar bloco
      </Button>
    </FieldSet>
  );
}
