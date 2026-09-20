import type { SemanticResolution, QueryProjectionSemanticResolution } from '../../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { PrimitiveKind, PrimitiveType, ReferenceType } from '../../../compiler/types/SemanticType';
import { semanticResolutionToBoundType } from '../../semanticResolutionToBoundType';
import type { EloquentCardinality, EloquentReturn } from '../../EloquentRegistry';
import type { ResolutionCardinality } from '../../../types/domain/semanticResolution';

export function toBoundResolutionCardinality(cardinality: ResolutionCardinality) {
  switch (cardinality.kind) {
    case 'single': return { kind: 'single' } as const;
    case 'collection': return { kind: 'collection' } as const;
    case 'paginated_collection': return { kind: 'paginated_collection' } as const;
  }
}

export function cardinalityFromEloquent(cardinality: EloquentCardinality) {
  switch (cardinality.kind) {
    case 'single': return { kind: 'single' } as const;
    case 'collection': return { kind: 'collection' } as const;
    case 'paginated_collection': return { kind: 'paginated_collection' } as const;
  }
}

export function resultType(returnValue: EloquentReturn, modelName: string) {
  switch (returnValue.kind) {
    case 'number': return new PrimitiveType(PrimitiveKind.NUMBER);
    case 'boolean': return new PrimitiveType(PrimitiveKind.BOOLEAN);
    case 'model': return ReferenceType.model('', modelName);
    case 'builder': return ReferenceType.model('', modelName);
    case 'array': return new PrimitiveType(PrimitiveKind.UNKNOWN);
  }
}

export function scalar(trace: SemanticResolution['trace'], boundAst: SemanticResolution['boundAst'], semanticType: PrimitiveType, confidence: number): SemanticResolution {
  return SemanticResolutionFactory.scalar({
    status: 'resolved', confidence, trace, boundAst, semanticType, nullability: { kind: 'non_nullable' },
  });
}

export function unknown(source: string, rule: string): SemanticResolution {
  return SemanticResolutionFactory.unknown({
    status: 'unknown', confidence: 0,
    trace: [{ source, rule, input: '', output: 'unknown' }],
    boundAst: BoundSemanticFactory.unsupported('unresolved_method'),
  });
}

export function resolveFirstQueryProjection(
  target: QueryProjectionSemanticResolution,
  methodName: string,
  sourceName: string,
): SemanticResolution {
  const semanticType = semanticResolutionToBoundType(target);
  const trace = [...target.trace, {
    source: sourceName,
    rule: 'Query projection preserved through first()',
    input: methodName,
    output: 'nullable single query projection',
  }];
  const boundAst = BoundSemanticFactory.queryProjection({
    sourceModel: target.sourceModel, surface: target.surface,
    cardinality: { kind: 'single' }, nullability: { kind: 'nullable' },
  });
  return SemanticResolutionFactory.queryProjection({
    status: 'resolved', confidence: target.confidence, trace, boundAst,
    sourceModel: target.sourceModel, sourceDefinition: target.sourceDefinition, surface: target.surface,
    cardinality: { kind: 'single' }, nullability: { kind: 'nullable' },
  });
}
