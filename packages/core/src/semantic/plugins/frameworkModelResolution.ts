import type { FrameworkMethodRule } from '../FrameworkRegistry';
import type { ResolutionContext } from '../types';
import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { SemanticTraceNode } from '../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import { relationResolve } from '../kernel/relationalSequence';

export function resolveFrameworkModel(
  rule: Extract<FrameworkMethodRule['returns'], { kind: 'model' }>,
  input: string,
  context: ResolutionContext,
  trace: readonly SemanticTraceNode[],
  confidence: number,
): SemanticResolution {
  const symbol = context.symbolTable.get(rule.model.value);
  return relationResolve(context.symbolTable.has(rule.model.value),
    () => SemanticResolutionFactory.model({
    status: 'resolved', confidence,
    trace,
    boundAst: BoundSemanticFactory.modelReference(rule.model),
    model: rule.model,
    definition: symbol.node.definition,
    cardinality: rule.cardinality,
  }),
    () => SemanticResolutionFactory.indeterminate({
      status: 'indeterminate', confidence: 0, trace,
      boundAst: BoundSemanticFactory.unsupported('unresolved_symbol'),
    }));
}
