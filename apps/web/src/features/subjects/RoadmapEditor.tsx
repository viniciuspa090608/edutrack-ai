import { useEffect, useRef } from 'react';
import type { RoadmapContent } from '@study-platform/contracts';
const blankStep = () => ({ title: '', description: '' });
export const blankRoadmap = (): RoadmapContent => ({
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
  value: RoadmapContent;
  onChange: (value: RoadmapContent) => void;
  disabled: boolean;
}) {
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  const blockChange = (
    index: number,
    patch: Partial<RoadmapContent['blocks'][number]>,
  ) =>
    onChange({
      ...value,
      blocks: value.blocks.map((block, i) =>
        i === index ? { ...block, ...patch } : block,
      ),
    });
  return (
    <fieldset disabled={disabled} aria-label="Conteúdo do roadmap">
      <label>
        Título do roadmap
        <input
          ref={first}
          required
          maxLength={120}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </label>
      <label>
        Descrição do roadmap
        <textarea
          required
          maxLength={1000}
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </label>
      {value.blocks.map((block, index) => (
        <fieldset
          className="roadmap-block"
          key={index}
          aria-label={`Bloco ${index + 1}`}
        >
          <legend>Bloco {index + 1}</legend>
          <label>
            Título do bloco {index + 1}
            <input
              required
              maxLength={120}
              value={block.title}
              onChange={(e) => blockChange(index, { title: e.target.value })}
            />
          </label>
          <label>
            Descrição do bloco {index + 1}
            <textarea
              required
              maxLength={1000}
              value={block.description}
              onChange={(e) =>
                blockChange(index, { description: e.target.value })
              }
            />
          </label>
          <div className="subject-actions">
            <button
              type="button"
              disabled={index === 0}
              onClick={() =>
                onChange({ ...value, blocks: move(value.blocks, index, -1) })
              }
            >
              Subir bloco {index + 1}
            </button>
            <button
              type="button"
              disabled={index === value.blocks.length - 1}
              onClick={() =>
                onChange({ ...value, blocks: move(value.blocks, index, 1) })
              }
            >
              Descer bloco {index + 1}
            </button>
            <button
              type="button"
              disabled={value.blocks.length === 1}
              onClick={() =>
                onChange({
                  ...value,
                  blocks: value.blocks.filter((_, i) => i !== index),
                })
              }
            >
              Excluir bloco {index + 1}
            </button>
          </div>
          {block.steps.map((step, stepIndex) => (
            <fieldset
              className="roadmap-step"
              key={stepIndex}
              aria-label={`Passo ${index + 1}.${stepIndex + 1}`}
            >
              <legend>
                Passo {index + 1}.{stepIndex + 1}
              </legend>
              <label>
                Título do passo {index + 1}.{stepIndex + 1}
                <input
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
              </label>
              <label>
                Descrição do passo {index + 1}.{stepIndex + 1}
                <textarea
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
              </label>
              <div className="subject-actions">
                <button
                  type="button"
                  disabled={stepIndex === 0}
                  onClick={() =>
                    blockChange(index, {
                      steps: move(block.steps, stepIndex, -1),
                    })
                  }
                >
                  Subir passo {index + 1}.{stepIndex + 1}
                </button>
                <button
                  type="button"
                  disabled={stepIndex === block.steps.length - 1}
                  onClick={() =>
                    blockChange(index, {
                      steps: move(block.steps, stepIndex, 1),
                    })
                  }
                >
                  Descer passo {index + 1}.{stepIndex + 1}
                </button>
                <button
                  type="button"
                  disabled={block.steps.length === 1}
                  onClick={() =>
                    blockChange(index, {
                      steps: block.steps.filter((_, i) => i !== stepIndex),
                    })
                  }
                >
                  Excluir passo {index + 1}.{stepIndex + 1}
                </button>
              </div>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={block.steps.length >= 20}
            onClick={() =>
              blockChange(index, { steps: [...block.steps, blankStep()] })
            }
          >
            Adicionar passo ao bloco {index + 1}
          </button>
        </fieldset>
      ))}
      <button
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
      </button>
    </fieldset>
  );
}
