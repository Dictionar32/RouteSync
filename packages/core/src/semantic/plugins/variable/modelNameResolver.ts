import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import type { ResolutionContext } from '../../types';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';

export function resolveModelByName(
  name: string,
  symbolTable: ResolutionContext['symbolTable'],
): SemanticResolution | null {
  const symbol = symbolTable.get(name);
  if (!symbol) return null;

  const model = SemanticValueFactory.modelName(symbol.name);
  return SemanticResolutionFactory.model({
    status: 'resolved', confidence: 80, model,
    cardinality: { kind: 'single' },
    boundAst: BoundSemanticFactory.modelReference(model),
    trace: [{
      source: 'VariableResolver',
      rule: 'Variable name exact match to verified model symbol',
      input: name,
      output: `model: ${model.value}`,
    }],
  });
}
