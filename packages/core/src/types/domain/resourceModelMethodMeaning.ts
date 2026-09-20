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

export interface ResourceQueryMutationVisitor<R> {
  readonly filter: (operation: Extract<ResourceQueryMutation, { readonly kind: 'filter' }>) => R;
  readonly relation_filter: (operation: Extract<ResourceQueryMutation, { readonly kind: 'relation_filter' }>) => R;
  readonly relation_load: (operation: Extract<ResourceQueryMutation, { readonly kind: 'relation_load' }>) => R;
  readonly ordering: (operation: Extract<ResourceQueryMutation, { readonly kind: 'ordering' }>) => R;
  readonly projection: (operation: Extract<ResourceQueryMutation, { readonly kind: 'projection' }>) => R;
  readonly pagination: (operation: Extract<ResourceQueryMutation, { readonly kind: 'pagination' }>) => R;
  readonly window: (operation: Extract<ResourceQueryMutation, { readonly kind: 'window' }>) => R;
  readonly grouping: (operation: Extract<ResourceQueryMutation, { readonly kind: 'grouping' }>) => R;
  readonly having: (operation: Extract<ResourceQueryMutation, { readonly kind: 'having' }>) => R;
  readonly locking: (operation: Extract<ResourceQueryMutation, { readonly kind: 'locking' }>) => R;
  readonly distinct: (operation: Extract<ResourceQueryMutation, { readonly kind: 'distinct' }>) => R;
  readonly conditional: (operation: Extract<ResourceQueryMutation, { readonly kind: 'conditional' }>) => R;
}

export function matchResourceQueryMutation<R>(operation: ResourceQueryMutation, visitor: ResourceQueryMutationVisitor<R>): R {
  switch (operation.kind) {
    case 'filter': return visitor.filter(operation);
    case 'relation_filter': return visitor.relation_filter(operation);
    case 'relation_load': return visitor.relation_load(operation);
    case 'ordering': return visitor.ordering(operation);
    case 'projection': return visitor.projection(operation);
    case 'pagination': return visitor.pagination(operation);
    case 'window': return visitor.window(operation);
    case 'grouping': return visitor.grouping(operation);
    case 'having': return visitor.having(operation);
    case 'locking': return visitor.locking(operation);
    case 'distinct': return visitor.distinct(operation);
    case 'conditional': return visitor.conditional(operation);
  }
}

export interface ResourceMethodMeaningDescriptor {
  readonly method: MethodName;
  readonly meaning: ResourceModelMethodMeaning;
  readonly receiver: ModelSemanticDefinition;
}

export interface ResourceModelMethodMeaningVisitor<R> {
  readonly query_origin: (meaning: Extract<ResourceModelMethodMeaning, { readonly kind: 'query_origin' }>) => R;
  readonly query_mutation: (meaning: Extract<ResourceModelMethodMeaning, { readonly kind: 'query_mutation' }>) => R;
  readonly single_model: (meaning: Extract<ResourceModelMethodMeaning, { readonly kind: 'single_model' }>) => R;
  readonly model_collection: (meaning: Extract<ResourceModelMethodMeaning, { readonly kind: 'model_collection' }>) => R;
  readonly paginated_collection: (meaning: Extract<ResourceModelMethodMeaning, { readonly kind: 'paginated_collection' }>) => R;
  readonly scalar: (meaning: Extract<ResourceModelMethodMeaning, { readonly kind: 'scalar' }>) => R;
  readonly value_collection: (meaning: Extract<ResourceModelMethodMeaning, { readonly kind: 'value_collection' }>) => R;
  readonly unsupported: (meaning: Extract<ResourceModelMethodMeaning, { readonly kind: 'unsupported' }>) => R;
}

export function matchResourceModelMethodMeaning<R>(meaning: ResourceModelMethodMeaning, visitor: ResourceModelMethodMeaningVisitor<R>): R {
  switch (meaning.kind) {
    case 'query_origin': return visitor.query_origin(meaning);
    case 'query_mutation': return visitor.query_mutation(meaning);
    case 'single_model': return visitor.single_model(meaning);
    case 'model_collection': return visitor.model_collection(meaning);
    case 'paginated_collection': return visitor.paginated_collection(meaning);
    case 'scalar': return visitor.scalar(meaning);
    case 'value_collection': return visitor.value_collection(meaning);
    case 'unsupported': return visitor.unsupported(meaning);
  }
}
