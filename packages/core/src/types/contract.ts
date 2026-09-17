/** Semantic contract boundary. Semantic meaning is defined once in domain ADTs. */
export type {
  SemanticResolution,
  ScalarSemanticResolution,
  ModelSemanticResolution,
  ResourceSemanticResolution,
  ObjectSemanticResolution,
  QueryProjectionSemanticResolution,
  UnknownSemanticResolution,
  SemanticTraceNode,
  ResolutionCardinality,
  ResolutionStatus,
} from './domain/semanticResolution';

export { matchSemanticResolution } from './domain/semanticResolution';

export type AccessKind = 'array_access' | 'property_access' | 'optional_access';

export interface JsonObjectResolution {
  readonly kind: 'json_object';
  readonly sourceModel: import('./domain/semanticValues').ModelName;
  readonly sourceColumn: import('./domain/semanticValues').ColumnName;
}

export interface JsonMemberResolution {
  readonly kind: 'json_member';
  readonly parent: JsonObjectResolution | JsonMemberResolution;
  readonly key: import('./domain/semanticValues').PropertyName;
  readonly accessKind: AccessKind;
  readonly nullability: import('./domain/boundAst').BoundNullability;
}
