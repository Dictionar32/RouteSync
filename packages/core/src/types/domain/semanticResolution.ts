/**
 * Closed semantic resolution ADT.
 *
 * This is the upstream semantic contract. Identity is carried by qualified
 * value objects, not by optional strings that downstream code has to guess.
 */
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { BoundSemanticNode, BoundCardinality, BoundNullability } from './boundAst';
import type { ModelName, ResourceName, ResponseFieldName } from './semanticValues';

export type ResolutionStatus = 'resolved' | 'unknown' | 'partial';

export interface SemanticTraceNode {
  readonly source: string;
  readonly rule: string;
  readonly input: string;
  readonly output: string;
}

interface ResolutionBase {
  readonly status: ResolutionStatus;
  readonly confidence: number;
  readonly trace: readonly SemanticTraceNode[];
  readonly boundAst: BoundSemanticNode;
}

export type ResolutionCardinality =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' }
  | { readonly kind: 'paginated_collection' };

export interface ScalarSemanticResolution extends ResolutionBase {
  readonly kind: 'scalar';
  readonly semanticType: SemanticType;
  readonly nullability: BoundNullability;
}

export interface ModelSemanticResolution extends ResolutionBase {
  readonly kind: 'model';
  readonly model: ModelName;
  readonly cardinality: ResolutionCardinality;
}

export interface ResourceSemanticResolution extends ResolutionBase {
  readonly kind: 'resource';
  readonly resource: ResourceName;
  readonly cardinality: ResolutionCardinality;
}

export interface ObjectSemanticResolution extends ResolutionBase {
  readonly kind: 'object';
  readonly fields: readonly (readonly [ResponseFieldName, SemanticType])[];
}

export interface QueryProjectionSemanticResolution extends ResolutionBase {
  readonly kind: 'query_projection';
  readonly sourceModel: ModelName;
  readonly fields: readonly (readonly [ResponseFieldName, SemanticType])[];
  /** Cardinality/nullability are part of the projection contract and survive query methods. */
  readonly cardinality: BoundCardinality;
  readonly nullability: BoundNullability;
}

export interface UnknownSemanticResolution extends ResolutionBase {
  readonly kind: 'unknown';
}

export type SemanticResolution =
  | ScalarSemanticResolution
  | ModelSemanticResolution
  | ResourceSemanticResolution
  | ObjectSemanticResolution
  | QueryProjectionSemanticResolution
  | UnknownSemanticResolution;

export function matchSemanticResolution<T>(
  resolution: SemanticResolution,
  visitor: {
    scalar: (value: ScalarSemanticResolution) => T;
    model: (value: ModelSemanticResolution) => T;
    resource: (value: ResourceSemanticResolution) => T;
    object: (value: ObjectSemanticResolution) => T;
    query_projection: (value: QueryProjectionSemanticResolution) => T;
    unknown: (value: UnknownSemanticResolution) => T;
  }
): T {
  switch (resolution.kind) {
    case 'scalar': return visitor.scalar(resolution);
    case 'model': return visitor.model(resolution);
    case 'resource': return visitor.resource(resolution);
    case 'object': return visitor.object(resolution);
    case 'query_projection': return visitor.query_projection(resolution);
    case 'unknown': return visitor.unknown(resolution);
  }
}
