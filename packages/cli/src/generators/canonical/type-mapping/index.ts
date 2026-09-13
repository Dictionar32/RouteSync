/**
 * index.ts
 *
 * Canonical type mapping domain exports.
 *
 * @module cli/generators/canonical/type-mapping
 */

export {
    SQL_TO_TYPE_MAP,
    CAST_TO_TYPE_MAP,
    type SqlTypeMapping,
} from './constants';

export {
    getSqlTypeMapping,
    getCastMapping,
    mapSqlTypeToMapping,
} from './resolvers';
