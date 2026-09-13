/**
 * Resource & Model Naming Utility
 *
 * Single source of truth for Laravel Eloquent table name inference,
 * case transformations, and class basename extractions.
 * Conforms to Rule 14: Active Consumer Orchestrator, 0 wildcard re-exports.
 *
 * @module core/utils/resource-naming
 */

import {
    CharKind,
    LexerState,
    IdentifierCase,
    extractClassBasename,
    inferLaravelTableName,
    capitalize,
    ResourceNamingConvention,
    resourceBaseName
} from './naming';

export {
    CharKind,
    LexerState,
    IdentifierCase,
    extractClassBasename,
    inferLaravelTableName,
    capitalize,
    ResourceNamingConvention,
    resourceBaseName
};

// Canonical Aliases for System-wide Integration (Active Consumption)
export const toPascalCase = (str: string): string => IdentifierCase.toPascal(str);
export const toCamelCase = (str: string): string => IdentifierCase.toCamel(str);
export const toSnakeCase = (str: string): string => IdentifierCase.toSnake(str);
