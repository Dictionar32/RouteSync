import type { SemanticType } from '../../compiler/types/SemanticType';
import type { BoundSemanticNode, BoundCardinality, BoundNullability } from './boundAst';
import type { ModelName, ResourceName, ResponseFieldName } from './semanticValues';
import type {
  SemanticResolution,
  SemanticTraceNode,
  ResolutionStatus,
} from './semanticResolution';

interface Common {
  readonly status: ResolutionStatus;
  readonly confidence: number;
  readonly trace: readonly SemanticTraceNode[];
  readonly boundAst: BoundSemanticNode;
}

export const SemanticResolutionFactory = Object.freeze({
  scalar(input: Common & { semanticType: SemanticType; nullability: BoundNullability }): SemanticResolution {
    return Object.freeze({ kind: 'scalar', ...input });
  },
  model(input: Common & { model: ModelName; cardinality: import('./semanticResolution').ResolutionCardinality }): SemanticResolution {
    return Object.freeze({ kind: 'model', ...input });
  },
  resource(input: Common & { resource: ResourceName; cardinality: import('./semanticResolution').ResolutionCardinality }): SemanticResolution {
    return Object.freeze({ kind: 'resource', ...input });
  },
  object(input: Common & { fields: readonly (readonly [ResponseFieldName, SemanticType])[] }): SemanticResolution {
    return Object.freeze({ kind: 'object', ...input });
  },
  queryProjection(input: Common & { sourceModel: ModelName; fields: readonly (readonly [ResponseFieldName, SemanticType])[]; cardinality: BoundCardinality; nullability: BoundNullability }): SemanticResolution {
    return Object.freeze({ kind: 'query_projection', ...input });
  },
  unknown(input: Common): SemanticResolution {
    return Object.freeze({ kind: 'unknown', ...input });
  },
});
