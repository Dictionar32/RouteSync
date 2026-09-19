import type { ResourceComputationSemantic } from './resourceComputationSemantic';
import type { ResourceCollectionState } from './resourceCollectionTransformation';
import type { VariableName } from './semanticValues';

export interface ResourceCollectionCallbackParameter {
  readonly variable: VariableName;
  readonly input: ResourceCollectionState;
}

export type ResourceCollectionCallbackResult =
  | { readonly kind: 'computed'; readonly computation: ResourceComputationSemantic }
  | { readonly kind: 'preserved'; readonly source: ResourceCollectionState };

export interface ResourceCollectionCallbackModel {
  readonly parameter: ResourceCollectionCallbackParameter;
  readonly result: ResourceCollectionCallbackResult;
}
