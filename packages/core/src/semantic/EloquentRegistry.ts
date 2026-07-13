/**
 * Eloquent query-builder method knowledge, separated from FrameworkRegistry.ts
 * on purpose — this is ORM/query-builder semantics (chaining, pagination,
 * aggregation), a different concern from general Laravel helpers (Carbon,
 * Sanctum, global functions). Keeping them in one file was already starting
 * to blur "is this a Laravel helper or a query builder method" — see the
 * design review thread's suggestion to eventually split MethodReturnResolver
 * into its own EloquentMethodResolver plugin. This registry is that split's
 * data half; MethodReturnResolver is now just the orchestration half.
 */

export type EloquentReturnKind = 'model' | 'builder' | 'number' | 'boolean' | 'array'

export interface EloquentMethodRule {
  returns: EloquentReturnKind
  /** Only meaningful for returns: 'model' — fixed collection-ness. 'builder' pass-through methods keep whatever collection-ness the target already had instead. */
  collection?: boolean
  paginated?: boolean
}

export const ELOQUENT_METHOD_REGISTRY: Record<string, EloquentMethodRule> = {
  // returns a single model instance
  first: { returns: 'model', collection: false },
  find: { returns: 'model', collection: false },
  findOrFail: { returns: 'model', collection: false },
  create: { returns: 'model', collection: false },
  update: { returns: 'model', collection: false },
  firstOrCreate: { returns: 'model', collection: false },

  // returns a collection of models
  get: { returns: 'model', collection: true },
  all: { returns: 'model', collection: true },

  // returns a paginated collection
  paginate: { returns: 'model', collection: true, paginated: true },
  simplePaginate: { returns: 'model', collection: true, paginated: true },
  cursorPaginate: { returns: 'model', collection: true, paginated: true },

  // query builder pass-through — still the same model, collection/paginated
  // inherited from whatever the chain already resolved to, not fixed here
  where: { returns: 'builder' }, whereIn: { returns: 'builder' }, whereNotIn: { returns: 'builder' },
  whereNull: { returns: 'builder' }, whereNotNull: { returns: 'builder' },
  whereBetween: { returns: 'builder' }, whereNotBetween: { returns: 'builder' },
  whereDate: { returns: 'builder' }, whereMonth: { returns: 'builder' }, whereDay: { returns: 'builder' },
  whereYear: { returns: 'builder' }, whereTime: { returns: 'builder' }, whereColumn: { returns: 'builder' },
  orWhere: { returns: 'builder' }, orWhereIn: { returns: 'builder' },
  orderBy: { returns: 'builder' }, orderByDesc: { returns: 'builder' },
  latest: { returns: 'builder' }, oldest: { returns: 'builder' }, inRandomOrder: { returns: 'builder' },
  select: { returns: 'builder' }, addSelect: { returns: 'builder' }, distinct: { returns: 'builder' },
  join: { returns: 'builder' }, leftJoin: { returns: 'builder' }, rightJoin: { returns: 'builder' }, crossJoin: { returns: 'builder' },
  groupBy: { returns: 'builder' }, having: { returns: 'builder' }, havingRaw: { returns: 'builder' },
  skip: { returns: 'builder' }, offset: { returns: 'builder' }, limit: { returns: 'builder' }, take: { returns: 'builder' },
  with: { returns: 'builder' }, withCount: { returns: 'builder' }, load: { returns: 'builder' }, loadCount: { returns: 'builder' },
  has: { returns: 'builder' }, whereHas: { returns: 'builder' }, query: { returns: 'builder' },

  // aggregate -> number
  count: { returns: 'number' }, sum: { returns: 'number' }, avg: { returns: 'number' },
  min: { returns: 'number' }, max: { returns: 'number' },

  // boolean
  exists: { returns: 'boolean' }, doesntExist: { returns: 'boolean' },

  // conversion -> array
  pluck: { returns: 'array' }, toArray: { returns: 'array' }, jsonSerialize: { returns: 'array' },
}

export function lookupEloquentMethod(name: string): EloquentMethodRule | undefined {
  return ELOQUENT_METHOD_REGISTRY[name]
}
