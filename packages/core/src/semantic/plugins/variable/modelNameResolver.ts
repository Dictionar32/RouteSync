import type { VariableResolutionResult } from './variableResolutionResult';
import type { ResolutionContext } from '../../types';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { matchLookup } from '../../../types/upstream/collections';

export function resolveModelByName(
  name: string,
  symbolTable: ResolutionContext['symbolTable'],
): VariableResolutionResult {
  return matchLookup(symbolTable.lookup(name), {
    missing: () => ({ kind: 'not_found', reason: 'no_model' }),
    found: ({ value: symbol }) => {
      const model = SemanticValueFactory.modelName(symbol.name);
      return { kind: 'resolved', value: SemanticResolutionFactory.model({
        status: 'resolved', confidence: 80, model,
        definition: symbol.node.definition,
        cardinality: { kind: 'single' },
        boundAst: BoundSemanticFactory.modelReference(model),
        trace: [{
          source: 'VariableResolver',
          rule: 'Variable name exact match to verified model symbol',
          input: name,
          output: `model: ${model.value}`,
        }],
      }) };
    },
  });
}
