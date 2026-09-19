import type { MethodName, PropertyName } from './semanticValues';
import type { ResourceCollectionState } from './resourceCollectionTransformation';

export interface ResourceCollectionGroupModel {
  readonly method: MethodName;
  readonly key: PropertyName;
  readonly source: ResourceCollectionState;
  readonly result: ResourceCollectionGroupedState;
}

export interface ResourceCollectionGroupedState {
  readonly kind: 'grouped_collection';
  readonly key: PropertyName;
  readonly element: ResourceCollectionState;
}
