/**
 * resolvers.ts
 *
 * SQL and Cast type mapping resolution logic.
 * Pure Catamorphic Dispatch: 0 'if', 0 'switch', 0 naked 'Record'.
 *
 * @module cli/generators/canonical/type-mapping
 */

import {
    DatabaseColumnTypeMapper,
    matchDatabaseColumnKind,
    EloquentCastMapper,
    matchEloquentCastKind,
} from '@routesync/core';
import type { SqlTypeMapping } from './constants';
import {
    createSqlTypeVisitor,
    CAST_TYPE_VISITOR,
    UNKNOWN_SQL_TYPE_MAPPING,
} from './visitors';

export function getSqlTypeMapping(sqlType: string): SqlTypeMapping | null {
    const kind = DatabaseColumnTypeMapper.toColumnKind(sqlType);
    const mapping = matchDatabaseColumnKind(kind, createSqlTypeVisitor(sqlType));
    return mapping.baseType === 'unknown' ? null : mapping;
}

export function getCastMapping(castType: string): SqlTypeMapping | null {
    const { castKind } = EloquentCastMapper.map(castType);
    const mapping = matchEloquentCastKind(castKind, CAST_TYPE_VISITOR);
    return mapping.baseType === 'unknown' ? null : mapping;
}

export function mapSqlTypeToMapping(sqlType: string, cast?: string): SqlTypeMapping {
    const castMapping = cast ? getCastMapping(cast) : null;
    const sqlMapping = getSqlTypeMapping(sqlType);
    return castMapping ?? sqlMapping ?? UNKNOWN_SQL_TYPE_MAPPING;
}
