import type { FrameworkMethodRule } from '../FrameworkRegistry';
import type { ResolutionContext } from '../types';
import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { SemanticTraceNode } from '../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { SemanticValueFactory } from '../../types/domain/semanticValues';

export function resolveFrameworkModel(
  rule: Extract<FrameworkMethodRule['returns'], { kind: 'model' }>,
  input: string,
  context: ResolutionContext,
  trace: readonly SemanticTraceNode[],
  confidence: number,
): SemanticResolution {
  const symbol = context.symbolTable.get(rule.model.value);
  if (symbol === undefined) {
    return SemanticResolutionFactory.unknown({
      status: 'unknown', confidence: 0, trace,
      boundAst: BoundSemanticFactory.unsupported('unresolved_symbol'),
    });
  }
  return SemanticResolutionFactory.model({
    status: 'resolved', confidence,
    trace,
    boundAst: BoundSemanticFactory.modelReference(rule.model),
    model: rule.model,
    definition: symbol.node.semantic,
    cardinality: rule.cardinality,
  });
}
