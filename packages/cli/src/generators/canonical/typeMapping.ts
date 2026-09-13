/**
 * typeMapping.ts
 *
 * SQL and Eloquent Cast type to TypeScript and Zod schema mapping.
 *
 * @module cli/generators/canonical/typeMapping
 */

export {
    SQL_TO_TYPE_MAP,
    CAST_TO_TYPE_MAP,
    type SqlTypeMapping,
    getSqlTypeMapping,
    getCastMapping,
    mapSqlTypeToMapping,
} from './type-mapping';
