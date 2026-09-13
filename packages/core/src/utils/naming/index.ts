/**
 * Naming Subdomain Index.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/utils/naming
 */

export {
    CharKind,
    LexerState,
    IdentifierCase
} from './caseLexer';

export {
    extractClassBasename,
    inferLaravelTableName,
    capitalize,
    ResourceNamingConvention,
    resourceBaseName
} from './conventions';
