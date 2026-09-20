import { QueryProjectionFieldIndex, SemanticObjectFieldIndex } from './queryProjectionResolution';
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { BoundSemanticNode, BoundCardinality, BoundNullability } from './boundAst';
import type { ModelName, ResourceName, ResponseFieldName } from './semanticValues';
import type { ModelSemanticDefinition } from './models';
import type {
  SemanticResolution,
  SemanticObjectField,
  QueryProjectionField,
  QueryProjectionSurface,
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
  model(input: Common & { model: ModelName; definition: ModelSemanticDefinition; cardinality: import('./semanticResolution').ResolutionCardinality }): SemanticResolution {
    return Object.freeze({ kind: 'model', ...input });
  },
  resource(input: Common & { resource: ResourceName; cardinality: import('./semanticResolution').ResolutionCardinality }): SemanticResolution {
    return Object.freeze({ kind: 'resource', ...input });
  },
  object(input: Common & { fields: readonly SemanticObjectField[] }): SemanticResolution {
    const fields = Object.freeze([...input.fields]);
    return Object.freeze({
      kind: 'object',
      ...input,
      fields,
      surface: Object.freeze({ byName: new SemanticObjectFieldIndex(fields) }),
    });
  },
  queryProjection(input: Common & { sourceModel: ModelName; sourceDefinition: ModelSemanticDefinition; surface: QueryProjectionSurface; cardinality: BoundCardinality; nullability: BoundNullability }): SemanticResolution {
    return Object.freeze({ kind: 'query_projection', ...input });
  },
  queryProjectionSurface(fields: readonly QueryProjectionField[]): QueryProjectionSurface {
    const frozenFields = Object.freeze([...fields]);
    return Object.freeze({ fields: frozenFields, byName: new QueryProjectionFieldIndex(frozenFields) });
  },
  unknown(input: Common): SemanticResolution {
    return Object.freeze({ kind: 'unknown', ...input });
  },
});
