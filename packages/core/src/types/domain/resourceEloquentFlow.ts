import type { ModelName, MethodName, ResourceName } from './semanticValues';
import type { ResourceExpressionModel } from './resourceExpressionModel';
import type { ResourceMethodResult } from './resourceModelMethodSurface';

export type ResourceEloquentRoot =
  | { readonly kind: 'model'; readonly model: ModelName }
  | { readonly kind: 'variable'; readonly name: import('./semanticValues').VariableName };

export interface ResourceEloquentMethodStep {
  readonly method: MethodName;
  readonly arguments: readonly ResourceExpressionModel[];
  readonly result: ResourceMethodResult;
}

export interface ResourceEloquentFlowModel {
  readonly root: ResourceEloquentRoot;
  readonly steps: readonly ResourceEloquentMethodStep[];
  readonly final: ResourceMethodResult;
}

export type ResourceResponseTransform =
  | { readonly kind: 'resource_single'; readonly resource: ResourceName; readonly input: Extract<ResourceMethodResult, { readonly kind: 'single_model' }> }
  | { readonly kind: 'resource_collection'; readonly resource: ResourceName; readonly input: Extract<ResourceMethodResult, { readonly kind: 'model_collection' | 'paginated_collection' }> };

export interface ResourceResponseFlowModel {
  readonly source: ResourceEloquentFlowModel;
  readonly transform: ResourceResponseTransform;
}
