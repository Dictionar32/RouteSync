import type { MethodName } from './semanticValues';
import type { ResourceModelMethodMeaning } from './resourceModelMethodMeaning';

const KNOWN_METHODS = Object.freeze(['query','first','find','firstOrFail','findOrFail','sole','findOrNew','get','all','getModels','paginate','simplePaginate','cursorPaginate','exists','count','sum','avg','min','max','value','pluck','where','orWhere','whereHas','orWhereHas','with','without','latest','oldest','orderBy','orderByDesc','orderByRaw','select','selectRaw','addSelect','limit','offset','take','skip','groupBy','having','havingRaw','distinct','when','unless','lockForUpdate','sharedLock'] as const);

export function knownMethodNames(): readonly string[] { return KNOWN_METHODS; }


export function meaningFor(method: MethodName): ResourceModelMethodMeaning {
  switch (method.value.value) {
    case 'query': return { kind: 'query_origin' };
    case 'first': case 'find': return { kind: 'single_model', lookup: { kind: 'may_be_absent' } };
    case 'firstOrFail': case 'findOrFail': case 'sole': return { kind: 'single_model', lookup: { kind: 'raises_not_found' } };
    case 'findOrNew': return { kind: 'single_model', lookup: { kind: 'existing_or_new' } };
    case 'get': case 'all': case 'getModels': return { kind: 'model_collection' };
    case 'paginate': return { kind: 'paginated_collection', delivery: { kind: 'length_aware' } };
    case 'simplePaginate': return { kind: 'paginated_collection', delivery: { kind: 'simple' } };
    case 'cursorPaginate': return { kind: 'paginated_collection', delivery: { kind: 'cursor' } };
    case 'exists': return { kind: 'scalar', operation: 'exists' };
    case 'count': case 'sum': case 'avg': case 'min': case 'max': case 'value': return { kind: 'scalar', operation: method.value.value };
    case 'pluck': return { kind: 'value_collection' };
    case 'where': case 'orWhere': return { kind: 'query_mutation', operation: { kind: 'filter' } };
    case 'whereHas': case 'orWhereHas': return { kind: 'query_mutation', operation: { kind: 'relation_filter' } };
    case 'with': case 'without': return { kind: 'query_mutation', operation: { kind: 'relation_load' } };
    case 'latest': return { kind: 'query_mutation', operation: { kind: 'ordering', direction: 'descending' } };
    case 'oldest': case 'orderBy': case 'orderByRaw': return { kind: 'query_mutation', operation: { kind: 'ordering', direction: 'ascending' } };
    case 'orderByDesc': return { kind: 'query_mutation', operation: { kind: 'ordering', direction: 'descending' } };
    case 'select': case 'selectRaw': case 'addSelect': return { kind: 'query_mutation', operation: { kind: 'projection' } };
    case 'limit': case 'offset': case 'take': case 'skip': return { kind: 'query_mutation', operation: { kind: 'window', operation: method.value.value } };
    case 'groupBy': return { kind: 'query_mutation', operation: { kind: 'grouping' } };
    case 'having': case 'havingRaw': return { kind: 'query_mutation', operation: { kind: 'having' } };
    case 'distinct': return { kind: 'query_mutation', operation: { kind: 'distinct' } };
    case 'when': return { kind: 'query_mutation', operation: { kind: 'conditional', branch: 'when' } };
    case 'unless': return { kind: 'query_mutation', operation: { kind: 'conditional', branch: 'unless' } };
    case 'lockForUpdate': return { kind: 'query_mutation', operation: { kind: 'locking', mode: 'for_update' } };
    case 'sharedLock': return { kind: 'query_mutation', operation: { kind: 'locking', mode: 'shared' } };
    default: return { kind: 'unsupported' };
  }
}
