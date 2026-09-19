import type { VariableResolutionResult } from './variableResolutionResult';
import type { ResolutionContext } from '../../types';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';

export function resolveModelByName(
  name: string,
  symbolTable: ResolutionContext['symbolTable'],
): VariableResolutionResult {
  const symbol = symbolTable.get(name);
  if (!symbol) return { kind: 'not_found', reason: 'no_model' };

  const model = SemanticValueFactory.modelName(symbol.name);
  return { kind: 'resolved', value: SemanticResolutionFactory.model({
    status: 'resolved', confidence: 80, model,
    definition: symbol.node.semantic,
    cardinality: { kind: 'single' },
    boundAst: BoundSemanticFactory.modelReference(model),
    trace: [{
      source: 'VariableResolver',
      rule: 'Variable name exact match to verified model symbol',
      input: name,
      output: `model: ${model.value}`,
    }],
  }) };
}
