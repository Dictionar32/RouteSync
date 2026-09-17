import type { SemanticResolution } from '../types/domain/semanticResolution';
import { matchSemanticResolution } from '../types/domain/semanticResolution';
import { BoundSemanticFactory } from '../types/domain/boundAst';
import { SemanticResolutionFactory } from '../types/domain/semanticResolutionFactory';
import type { SemanticTraceNode } from '../types/domain/semanticResolution';

export function unknownResolution(
  source: string,
  rule: string,
  input: string,
  reason: Parameters<typeof BoundSemanticFactory.unsupported>[0] = 'unresolved_symbol',
): SemanticResolution {
  const trace: SemanticTraceNode[] = [{ source, rule, input, output: 'unknown' }];
  return SemanticResolutionFactory.unknown({
    status: 'unknown', confidence: 0, trace,
    boundAst: BoundSemanticFactory.unsupported(reason),
  });
}

export function resolutionLabel(resolution: SemanticResolution): string {
  return matchSemanticResolution(resolution, {
    scalar: value => `scalar (${value.semanticType.kind})`,
    model: value => `model (${value.model.value})`,
    resource: value => `resource (${value.resource.value})`,
    object: () => 'object',
    query_projection: value => `query_projection (${value.sourceModel.value})`,
    unknown: () => 'unknown',
  });
}
