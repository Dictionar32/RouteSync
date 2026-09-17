import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import type { ResolutionContext, ModelNode } from '../../types';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';

export function resolveThisVariable(
  context: ResolutionContext,
  currentModel?: ModelNode,
): SemanticResolution | null {
  if (currentModel === undefined) return null;
  const model = SemanticValueFactory.modelName(currentModel.name);
  return SemanticResolutionFactory.model({
    status: 'resolved', confidence: 100, model,
    cardinality: { kind: 'single' },
    boundAst: BoundSemanticFactory.modelReference(model),
    trace: [{
      source: 'VariableResolver', rule: 'this variable mapping to context model',
      input: 'this', output: `model: ${model.value}`,
    }],
  });
}
