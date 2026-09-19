import type { SemanticType } from '../../compiler/types/SemanticType';
import type { BoundCardinality, BoundNullability, BoundSemanticNode } from './boundAst';
import type { ColumnName, ModelName, ResponseFieldName } from './semanticValues';
import type { ModelSemanticDefinition } from './models';
import type { ResolutionStatus, SemanticTraceNode } from './semanticResolution';

interface ResolutionBase {
  readonly status: ResolutionStatus;
  readonly confidence: number;
  readonly trace: readonly SemanticTraceNode[];
  readonly boundAst: BoundSemanticNode;
}

export interface SemanticObjectField {
  readonly name: ResponseFieldName;
  readonly type: SemanticType;
}

export type QueryProjectionField =
  | { readonly kind: 'column'; readonly name: ResponseFieldName; readonly source: ColumnName; readonly type: SemanticType }
  | { readonly kind: 'aggregate'; readonly name: ResponseFieldName; readonly aggregate: 'avg' | 'count' | 'sum' | 'min' | 'max'; readonly source: { readonly kind: 'column'; readonly column: ColumnName } | { readonly kind: 'rows' }; readonly type: SemanticType };

export class QueryProjectionFieldIndex {
  private readonly lookup: ReadonlyMap<ResponseFieldName, QueryProjectionField>;

  constructor(fields: readonly QueryProjectionField[]) {
    const lookup = new Map<ResponseFieldName, QueryProjectionField>();
    for (const field of fields) lookup.set(field.name, field);
    this.lookup = lookup;
    Object.freeze(this);
  }

  public get(name: ResponseFieldName): QueryProjectionField | undefined { return this.lookup.get(name); }
  public has(name: ResponseFieldName): boolean { return this.lookup.has(name); }
  public get size(): number { return this.lookup.size; }
}

export interface QueryProjectionSurface {
  readonly fields: readonly QueryProjectionField[];
  readonly byName: QueryProjectionFieldIndex;
}

export interface QueryProjectionSemanticResolution extends ResolutionBase {
  readonly kind: 'query_projection';
  readonly sourceModel: ModelName;
  readonly sourceDefinition: ModelSemanticDefinition;
  readonly surface: QueryProjectionSurface;
  readonly cardinality: BoundCardinality;
  readonly nullability: BoundNullability;
}
