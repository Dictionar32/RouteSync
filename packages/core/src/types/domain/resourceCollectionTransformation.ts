import type { SemanticType } from '../../compiler/types/SemanticType';
import type { ModelName, MethodName, PropertyName, RelationName, ResourceName, VariableName } from './semanticValues';
import type { ResourceMethodResult } from './resourceModelMethodSurface';
import type { ResourceCollectionCallbackModel } from './resourceCollectionCallbackModel';
import type { ModelSemanticProperty } from './models';

export type ResourceCollectionCardinality =
  | { readonly kind: 'collection' }
  | { readonly kind: 'paginated_collection' };

export type ResourceCollectionElementSemantic =
  | { readonly kind: 'model'; readonly model: ModelName }
  | { readonly kind: 'property'; readonly sourceModel: ModelName; readonly property: PropertyName; readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'column' | 'accessor' }>; readonly type: SemanticType }
  | { readonly kind: 'relation'; readonly sourceModel: ModelName; readonly relation: RelationName; readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'relation' }>; readonly targetModel: ModelName; readonly cardinality: 'one' | 'many' }
  | { readonly kind: 'scalar'; readonly type: SemanticType }
  | { readonly kind: 'computed'; readonly sourceVariable: VariableName };

export type ResourceCollectionState =
  | { readonly kind: 'model_collection'; readonly model: ModelName }
  | { readonly kind: 'paginated_collection'; readonly model: ModelName }
  | { readonly kind: 'value_collection'; readonly element: ResourceCollectionElementSemantic }
  | { readonly kind: 'literal_collection'; readonly element: ResourceCollectionElementSemantic };

export type ResourceCollectionTransform =
  | { readonly kind: 'pluck_relation'; readonly method: MethodName; readonly relation: RelationName; readonly source: ResourceCollectionState; readonly result: ResourceCollectionState }
  | { readonly kind: 'pluck_property'; readonly method: MethodName; readonly property: PropertyName; readonly source: ResourceCollectionState; readonly result: ResourceCollectionState }
  | { readonly kind: 'filter'; readonly method: MethodName; readonly source: ResourceCollectionState; readonly result: ResourceCollectionState }
  | { readonly kind: 'values'; readonly method: MethodName; readonly source: ResourceCollectionState; readonly result: ResourceCollectionState }
  | { readonly kind: 'group_by'; readonly method: MethodName; readonly key: PropertyName; readonly source: ResourceCollectionState; readonly result: ResourceCollectionState }
  | { readonly kind: 'map'; readonly method: MethodName; readonly source: ResourceCollectionState; readonly result: ResourceCollectionState; readonly callback: ResourceCollectionCallback }
  | { readonly kind: 'through'; readonly method: MethodName; readonly source: ResourceCollectionState; readonly result: ResourceCollectionState }
  | { readonly kind: 'unsupported'; readonly method: MethodName; readonly source: ResourceCollectionState };

export type ResourceCollectionCallback = ResourceCollectionCallbackModel;

export type ResourceCollectionInput = Extract<ResourceMethodResult, { readonly kind: 'model_collection' | 'paginated_collection' }>;

export interface ResourceCollectionTransformationModel {
  readonly input: ResourceCollectionInput;
  readonly transforms: readonly ResourceCollectionTransform[];
  readonly final: ResourceCollectionState;
}

export type ResourceResourceCollectionInput = Extract<ResourceCollectionState, { readonly kind: 'model_collection' | 'paginated_collection' | 'value_collection' }>;

export interface ResourceResourceCollectionModel {
  readonly resource: ResourceName;
  readonly input: ResourceResourceCollectionInput;
}

export function preserveCollectionState(state: ResourceCollectionState): ResourceCollectionState {
  return state;
}

export function preserveAfterFilter(state: ResourceCollectionState): ResourceCollectionState {
  return state;
}

export function preserveAfterValues(state: ResourceCollectionState): ResourceCollectionState {
  return state;
}
