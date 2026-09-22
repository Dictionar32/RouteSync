import type { ResolutionContext } from '../../types';
import type { ResolutionScope } from '../../resolutionScope';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import type { VariableResolutionResult } from './variableResolutionResult';

export function resolveThisVariable(
  context: ResolutionContext,
  scope: ResolutionScope,
): VariableResolutionResult {
  if (scope.kind === 'global') return { kind: 'not_found', reason: 'no_context_model' };
  const model = SemanticValueFactory.modelName(scope.model.definition.identity.name);
  return { kind: 'resolved', value: SemanticResolutionFactory.model({
    status: 'resolved', confidence: 100, model,
    definition: scope.model.definition.semantic,
    cardinality: { kind: 'single' },
    boundAst: BoundSemanticFactory.modelReference(model),
    trace: [{
      source: 'VariableResolver', rule: 'this variable mapping to context model',
      input: 'this', output: `model: ${model.value}`,
    }],
  }) };
}
