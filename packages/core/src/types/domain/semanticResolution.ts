import { relationEqual } from '../../semantic/kernel/semanticRelations';
import { relationOptionFold, relationRefine } from '../../semantic/kernel/relationalSequence';
/**
 * Closed semantic resolution ADT.
 *
 * This is the upstream semantic contract. Identity is carried by qualified
 * value objects, not by optional strings that downstream code has to guess.
 */
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { BoundSemanticNode, BoundNullability } from './boundAst';
import type { ModelName, ResourceName } from './semanticValues';
import type { ModelSemanticDefinition } from './models';

export type ResolutionStatus = 'resolved' | 'indeterminate' | 'partial';

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
  readonly definition: ModelSemanticDefinition;
  readonly cardinality: ResolutionCardinality;
}

export interface ResourceSemanticResolution extends ResolutionBase {
  readonly kind: 'resource';
  readonly resource: ResourceName;
  readonly cardinality: ResolutionCardinality;
}

export type {
  SemanticObjectField,
  SemanticObjectFieldIndex,
  QueryProjectionField,
  QueryProjectionSurface,
  QueryProjectionSemanticResolution,
  QueryProjectionFieldIndex,
} from './queryProjectionResolution';

import type { QueryProjectionSemanticResolution } from './queryProjectionResolution';

export interface ObjectSemanticResolution extends ResolutionBase {
  readonly kind: 'object';
  readonly fields: readonly import('./queryProjectionResolution').SemanticObjectField[];
  readonly surface: {
    readonly byName: import('./queryProjectionResolution').SemanticObjectFieldIndex;
  };
}

export interface IndeterminateSemanticResolution extends ResolutionBase {
  readonly kind: 'indeterminate';
}

export type SemanticResolution =
  | ScalarSemanticResolution
  | ModelSemanticResolution
  | ResourceSemanticResolution
  | ObjectSemanticResolution
  | QueryProjectionSemanticResolution
  | IndeterminateSemanticResolution;

export function matchSemanticResolution<T>(
  resolution: SemanticResolution,
  visitor: {
    scalar: (value: ScalarSemanticResolution) => T;
    model: (value: ModelSemanticResolution) => T;
    resource: (value: ResourceSemanticResolution) => T;
    object: (value: ObjectSemanticResolution) => T;
    query_projection: (value: QueryProjectionSemanticResolution) => T;
    indeterminate: (value: IndeterminateSemanticResolution) => T;
  }
): T {
  const scalar = relationRefine(resolution, (value): value is ScalarSemanticResolution => relationEqual(value.kind, 'scalar'));
  return relationOptionFold(scalar, () => {
    const model = relationRefine(resolution, (value): value is ModelSemanticResolution => relationEqual(value.kind, 'model'));
    return relationOptionFold(model, () => {
      const resource = relationRefine(resolution, (value): value is ResourceSemanticResolution => relationEqual(value.kind, 'resource'));
      return relationOptionFold(resource, () => {
        const object = relationRefine(resolution, (value): value is ObjectSemanticResolution => relationEqual(value.kind, 'object'));
        return relationOptionFold(object, () => {
          const projection = relationRefine(resolution, (value): value is QueryProjectionSemanticResolution => relationEqual(value.kind, 'query_projection'));
          return relationOptionFold(projection, () => {
            const indeterminate = relationRefine(resolution, (value): value is IndeterminateSemanticResolution => relationEqual(value.kind, 'indeterminate'));
            return relationOptionFold(indeterminate, () => visitor.indeterminate({ ...resolution, kind: 'indeterminate' }), visitor.indeterminate);
          }, visitor.query_projection);
        }, visitor.object);
      }, visitor.resource);
    }, visitor.model);
  }, visitor.scalar);
}
