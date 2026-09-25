/** Closed Eloquent method vocabulary. Registry entries describe semantic transitions. */
export type EloquentCardinality =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' }
  | { readonly kind: 'paginated_collection' };

export type EloquentArrayElement =
  | { readonly kind: 'model' }
  | { readonly kind: 'unresolved' };

export type EloquentReturn =
  | { readonly kind: 'model'; readonly cardinality: EloquentCardinality }
  | { readonly kind: 'builder' }
  | { readonly kind: 'number' }
  | { readonly kind: 'boolean' }
  | { readonly kind: 'array'; readonly element: EloquentArrayElement };

export interface EloquentMethodRule {
  readonly returns: EloquentReturn;
}

const single = (): EloquentCardinality => ({ kind: 'single' });
const collection = (): EloquentCardinality => ({ kind: 'collection' });
const paginated = (): EloquentCardinality => ({ kind: 'paginated_collection' });
const model = (cardinality: EloquentCardinality): EloquentMethodRule => ({ returns: { kind: 'model', cardinality } });
const builder = (): EloquentMethodRule => ({ returns: { kind: 'builder' } });
const number = (): EloquentMethodRule => ({ returns: { kind: 'number' } });
const boolean = (): EloquentMethodRule => ({ returns: { kind: 'boolean' } });
const array = (element: EloquentArrayElement): EloquentMethodRule => ({ returns: { kind: 'array', element } });

const METHOD_ENTRIES: readonly (readonly [string, EloquentMethodRule])[] = [
  ['first', model(single())], ['find', model(single())], ['findOrFail', model(single())],
  ['create', model(single())], ['update', model(single())], ['updateOrCreate', model(single())], ['firstOrCreate', model(single())], ['fill', model(single())], ['save', model(single())],
  ['get', model(collection())], ['all', model(collection())],
  ['paginate', model(paginated())], ['simplePaginate', model(paginated())], ['cursorPaginate', model(paginated())],
  ['where', builder()], ['whereIn', builder()], ['whereNotIn', builder()], ['whereNull', builder()], ['whereNotNull', builder()],
  ['whereBetween', builder()], ['whereNotBetween', builder()], ['whereDate', builder()], ['whereMonth', builder()], ['whereDay', builder()],
  ['whereYear', builder()], ['whereTime', builder()], ['whereColumn', builder()], ['whereKey', builder()], ['orWhere', builder()], ['orWhereIn', builder()],
  ['orderBy', builder()], ['orderByDesc', builder()], ['latest', builder()], ['oldest', builder()], ['inRandomOrder', builder()],
  ['select', builder()], ['selectRaw', builder()], ['addSelect', builder()], ['distinct', builder()], ['join', builder()],
  ['leftJoin', builder()], ['rightJoin', builder()], ['crossJoin', builder()], ['groupBy', builder()], ['having', builder()],
  ['havingRaw', builder()], ['skip', builder()], ['offset', builder()], ['limit', builder()], ['take', builder()], ['with', builder()],
  ['withCount', builder()], ['load', builder()], ['loadCount', builder()], ['has', builder()], ['whereHas', builder()], ['lockForUpdate', builder()], ['sharedLock', builder()], ['query', builder()],
  ['count', number()], ['sum', number()], ['avg', number()], ['min', number()], ['max', number()],
  ['exists', boolean()], ['doesntExist', boolean()],
  ['pluck', array({ kind: 'unresolved' })], ['toArray', array({ kind: 'model' })], ['jsonSerialize', array({ kind: 'model' })],
];

export const ELOQUENT_METHOD_REGISTRY: ReadonlyMap<string, EloquentMethodRule> = new Map(METHOD_ENTRIES);

export function lookupEloquentMethod(name: string): EloquentMethodRule | undefined {
  return ELOQUENT_METHOD_REGISTRY.get(name);
}
