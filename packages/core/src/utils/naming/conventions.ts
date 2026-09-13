/**
 * Resource Naming Conventions and Helpers.
 *
 * @module core/utils/naming
 */

import { IdentifierCase } from './caseLexer';

/**
 * Extract simple class basename from Fully Qualified Class Name (FQCN).
 * Pure mathematical slice: lastIndexOf('\\') + 1
 * When no slash exists (-1), -1 + 1 = 0, slice(0) returns full string.
 */
export function extractClassBasename(fqcn: string): string {
    return fqcn.slice(fqcn.lastIndexOf('\\') + 1);
}

/**
 * Infer default Laravel Eloquent database table name from model name.
 * Replicates Laravel convention: Str::snake(Str::pluralStudly(class_basename($model)))
 * Example: 'OrderItem' -> 'order_items', 'Category' -> 'categories'
 */
export function inferLaravelTableName(modelName: string): string {
    const base = extractClassBasename(modelName);
    const snake = IdentifierCase.toSnake(base);
    
    switch (true) {
        case snake.endsWith('y') && !/[aeiou]y$/i.test(snake):
            return `${snake.slice(0, -1)}ies`;
        case snake.endsWith('s') || snake.endsWith('x') || snake.endsWith('ch') || snake.endsWith('sh'):
            return `${snake}es`;
        default:
            return `${snake}s`;
    }
}

export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * ResourceNamingConvention
 *
 * Canonical Domain Vocabulary for Laravel Resource and Transformed Type suffixes.
 */
export const ResourceNamingConvention = Object.freeze({
    ResourceSuffix: 'Resource',
    ResponseSuffix: 'Response',
    TransformedSuffix: 'Transformed',
    CombinedSuffix: 'ResourceTransformed',

    stripSuffix(name: string = ''): string {
        return (name || '').replace(/(Resource|Response|Transformed)$/, '');
    },

    toTransformedName(baseName: string): string {
        return `${IdentifierCase.toPascal(baseName)}ResourceTransformed`;
    }
} as const);

export function resourceBaseName(resourceName: string): string {
    return ResourceNamingConvention.stripSuffix(resourceName);
}
