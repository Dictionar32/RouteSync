import type { MethodName } from './semanticValues';
import type { ModelSemanticDefinition } from './models';
import type { ResourcePaginationDelivery } from './resourceResponseSemantic';

export type ResourceQueryMutation =
  | { readonly kind: 'filter' }
  | { readonly kind: 'relation_filter' }
  | { readonly kind: 'relation_load' }
  | { readonly kind: 'ordering'; readonly direction: 'ascending' | 'descending' }
  | { readonly kind: 'projection' }
  | { readonly kind: 'pagination' }
  | { readonly kind: 'window'; readonly operation: 'limit' | 'offset' | 'take' | 'skip' }
  | { readonly kind: 'grouping' }
  | { readonly kind: 'having' }
  | { readonly kind: 'locking'; readonly mode: 'for_update' | 'shared' }
  | { readonly kind: 'distinct' }
  | { readonly kind: 'conditional'; readonly branch: 'when' | 'unless' };

export type ResourceSingleLookup =
  | { readonly kind: 'may_be_absent' }
  | { readonly kind: 'raises_not_found' }
  | { readonly kind: 'existing_or_new' };

export type ResourceModelMethodMeaning =
  | { readonly kind: 'query_origin' }
  | { readonly kind: 'query_mutation'; readonly operation: ResourceQueryMutation }
  | { readonly kind: 'single_model'; readonly lookup: ResourceSingleLookup }
  | { readonly kind: 'model_collection' }
  | { readonly kind: 'paginated_collection'; readonly delivery: ResourcePaginationDelivery }
  | { readonly kind: 'scalar'; readonly operation: 'exists' | 'count' | 'sum' | 'avg' | 'min' | 'max' | 'value' }
  | { readonly kind: 'value_collection' }
  | { readonly kind: 'unsupported' };

export interface ResourceMethodMeaningDescriptor {
  readonly method: MethodName;
  readonly meaning: ResourceModelMethodMeaning;
  readonly receiver: ModelSemanticDefinition;
}
