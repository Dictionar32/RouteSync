import type { MethodName } from './semanticValues';
import type { ResourceModelMethodMeaning } from './resourceModelMethodMeaning';
import { dispatchValue } from '../../semantic/authority/declarativeDispatch';

const KNOWN_METHODS = Object.freeze(['query','first','find','firstOrFail','findOrFail','sole','findOrNew','get','all','getModels','paginate','simplePaginate','cursorPaginate','exists','count','sum','avg','min','max','value','pluck','where','orWhere','whereHas','orWhereHas','with','without','latest','oldest','orderBy','orderByDesc','orderByRaw','select','selectRaw','addSelect','limit','offset','take','skip','groupBy','having','havingRaw','distinct','when','unless','lockForUpdate','sharedLock'] as const);

export function knownMethodNames(): readonly string[] { return KNOWN_METHODS; }


export function meaningFor(method: MethodName): ResourceModelMethodMeaning {
  return dispatchValue(METHOD_MEANINGS, method.value.value, { kind: 'unsupported' });
}

const METHOD_MEANINGS: Readonly<Record<string, ResourceModelMethodMeaning>> = Object.freeze({
  query: { kind: 'query_origin' },
  first: { kind: 'single_model', lookup: { kind: 'may_be_absent' } }, find: { kind: 'single_model', lookup: { kind: 'may_be_absent' } },
  firstOrFail: { kind: 'single_model', lookup: { kind: 'raises_not_found' } }, findOrFail: { kind: 'single_model', lookup: { kind: 'raises_not_found' } }, sole: { kind: 'single_model', lookup: { kind: 'raises_not_found' } },
  findOrNew: { kind: 'single_model', lookup: { kind: 'existing_or_new' } },
  get: { kind: 'model_collection' }, all: { kind: 'model_collection' }, getModels: { kind: 'model_collection' },
  paginate: { kind: 'paginated_collection', delivery: { kind: 'length_aware' } },
  simplePaginate: { kind: 'paginated_collection', delivery: { kind: 'simple' } },
  cursorPaginate: { kind: 'paginated_collection', delivery: { kind: 'cursor' } },
  exists: { kind: 'scalar', operation: 'exists' }, count: { kind: 'scalar', operation: 'count' }, sum: { kind: 'scalar', operation: 'sum' }, avg: { kind: 'scalar', operation: 'avg' }, min: { kind: 'scalar', operation: 'min' }, max: { kind: 'scalar', operation: 'max' }, value: { kind: 'scalar', operation: 'value' },
  pluck: { kind: 'value_collection' },
  where: { kind: 'query_mutation', operation: { kind: 'filter' } }, orWhere: { kind: 'query_mutation', operation: { kind: 'filter' } },
  whereHas: { kind: 'query_mutation', operation: { kind: 'relation_filter' } }, orWhereHas: { kind: 'query_mutation', operation: { kind: 'relation_filter' } },
  with: { kind: 'query_mutation', operation: { kind: 'relation_load' } }, without: { kind: 'query_mutation', operation: { kind: 'relation_load' } },
  latest: { kind: 'query_mutation', operation: { kind: 'ordering', direction: 'descending' } },
  oldest: { kind: 'query_mutation', operation: { kind: 'ordering', direction: 'ascending' } }, orderBy: { kind: 'query_mutation', operation: { kind: 'ordering', direction: 'ascending' } }, orderByRaw: { kind: 'query_mutation', operation: { kind: 'ordering', direction: 'ascending' } },
  orderByDesc: { kind: 'query_mutation', operation: { kind: 'ordering', direction: 'descending' } },
  select: { kind: 'query_mutation', operation: { kind: 'projection' } }, selectRaw: { kind: 'query_mutation', operation: { kind: 'projection' } }, addSelect: { kind: 'query_mutation', operation: { kind: 'projection' } },
  limit: { kind: 'query_mutation', operation: { kind: 'window', operation: 'limit' } }, offset: { kind: 'query_mutation', operation: { kind: 'window', operation: 'offset' } }, take: { kind: 'query_mutation', operation: { kind: 'window', operation: 'take' } }, skip: { kind: 'query_mutation', operation: { kind: 'window', operation: 'skip' } },
  groupBy: { kind: 'query_mutation', operation: { kind: 'grouping' } }, having: { kind: 'query_mutation', operation: { kind: 'having' } }, havingRaw: { kind: 'query_mutation', operation: { kind: 'having' } }, distinct: { kind: 'query_mutation', operation: { kind: 'distinct' } },
  when: { kind: 'query_mutation', operation: { kind: 'conditional', branch: 'when' } }, unless: { kind: 'query_mutation', operation: { kind: 'conditional', branch: 'unless' } },
  lockForUpdate: { kind: 'query_mutation', operation: { kind: 'locking', mode: 'for_update' } }, sharedLock: { kind: 'query_mutation', operation: { kind: 'locking', mode: 'shared' } },
});


