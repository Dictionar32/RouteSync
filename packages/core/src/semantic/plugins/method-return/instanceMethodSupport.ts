import type { SemanticResolution, QueryProjectionSemanticResolution } from '../../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { PrimitiveKind, PrimitiveType, ReferenceType } from '../../../compiler/types/SemanticType';
import { semanticResolutionToBoundType } from '../../semanticResolutionToBoundType';
import type { EloquentCardinality, EloquentReturn } from '../../EloquentRegistry';
import type { ResolutionCardinality } from '../../../types/domain/semanticResolution';
import { relationFirst } from '../../kernel/relationalSequence';

type CardinalityEntry = { readonly kind: 'single' } | { readonly kind: 'collection' } | { readonly kind: 'paginated_collection' };
const CARDINALITY: Readonly<Record<string, CardinalityEntry>> = {
  single: { kind: 'single' },
  collection: { kind: 'collection' },
  paginated_collection: { kind: 'paginated_collection' },
};

export function toBoundResolutionCardinality(cardinality: ResolutionCardinality) {
  return CARDINALITY[cardinality.kind];
}

export function cardinalityFromEloquent(cardinality: EloquentCardinality) {
  return CARDINALITY[cardinality.kind];
}

const RESULT_TYPES = {
  number: () => primitiveType(PrimitiveKind.NUMBER),
  boolean: () => primitiveType(PrimitiveKind.BOOLEAN),
  model: (_modelName: string) => ReferenceType.model('', _modelName),
  builder: (_modelName: string) => ReferenceType.model('', _modelName),
  array: () => primitiveType(PrimitiveKind.INDETERMINATE),
};

export function resultType(returnValue: EloquentReturn, modelName: string) {
  return RESULT_TYPES[returnValue.kind](modelName);
}

export function scalar(trace: SemanticResolution['trace'], boundAst: SemanticResolution['boundAst'], semanticType: PrimitiveType, confidence: number): SemanticResolution {
  return SemanticResolutionFactory.scalar({ status: 'resolved', confidence, trace, boundAst, semanticType, nullability: { kind: 'non_nullable' } });
}

export function indeterminate(source: string, rule: string): SemanticResolution {
  return SemanticResolutionFactory.indeterminate({ status: 'indeterminate', confidence: 0, trace: [{ source, rule, input: '', output: 'indeterminate' }], boundAst: BoundSemanticFactory.unsupported('unresolved_method') });
}

export function resolveFirstQueryProjection(target: QueryProjectionSemanticResolution, methodName: string, sourceName: string): SemanticResolution {
  const semanticType = semanticResolutionToBoundType(target);
  const trace = [...target.trace, { source: sourceName, rule: 'Query projection preserved through first()', input: methodName, output: 'nullable single query projection' }];
  const boundAst = BoundSemanticFactory.queryProjection({ sourceModel: target.sourceModel, surface: target.surface, cardinality: { kind: 'single' }, nullability: { kind: 'nullable' } });
  return SemanticResolutionFactory.queryProjection({ status: 'resolved', confidence: target.confidence, trace, boundAst, sourceModel: target.sourceModel, sourceDefinition: target.sourceDefinition, surface: target.surface, cardinality: { kind: 'single' }, nullability: { kind: 'nullable' } });
}
