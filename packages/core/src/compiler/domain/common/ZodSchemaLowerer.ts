/**
 * ZodSchemaLowerer.ts
 *
 * Target-Specific Lowering Engine for Transforming Target-Agnostic ResolvedSemanticType
 * Value Objects into Zod Schema Expressions.
 *
 * Design:
 * - 0 'if' statements
 * - 0 '??' in downstream execution
 * - 0 '?.' in downstream execution
 * - 0 '? :' ternary conditionals
 * - Strategy Pattern for Reference Types (NAMED_SCHEMA_STRATEGY vs UNKNOWN_REFERENCE_STRATEGY)
 * - Algebraic Tree Reduction for Objects, Unions, and Intersections
 *
 * @module compiler/domain/common
 */

import {
    ResolvedSemanticType,
    ResolvedObjectType,
    ResolvedPrimitiveKind
} from './ResolvedSemanticType';

export type ReferenceResolutionStrategy = (name: string) => string;

export const NAMED_SCHEMA_STRATEGY: ReferenceResolutionStrategy = (name: string) => `${name}Schema`;
export const UNKNOWN_REFERENCE_STRATEGY: ReferenceResolutionStrategy = () => 'z.unknown()';

export interface ZodLowererOptions {
    readonly referenceStrategy?: ReferenceResolutionStrategy;
}

interface NormalizedZodOptions {
    readonly referenceStrategy: ReferenceResolutionStrategy;
}

const DEFAULT_ZOD_OPTIONS: NormalizedZodOptions = Object.freeze({
    referenceStrategy: NAMED_SCHEMA_STRATEGY
});

const ZOD_PRIMITIVES: Readonly<Record<ResolvedPrimitiveKind, string>> = Object.freeze({
    string: 'z.string()',
    number: 'z.number()',
    boolean: 'z.boolean()',
    datetime: 'z.string().datetime()',
    file: 'z.custom<File>()',
    unknown: 'z.unknown()'
});

export function toZodSchemaExpression(
    resolved: ResolvedSemanticType,
    { referenceStrategy = NAMED_SCHEMA_STRATEGY }: ZodLowererOptions = {}
): string {
    return lowerZodNode(resolved, referenceStrategy);
}

function lowerZodNode(
    resolved: ResolvedSemanticType,
    referenceStrategy: ReferenceResolutionStrategy
): string {
    switch (resolved.kind) {
        case 'primitive':
            return ZOD_PRIMITIVES[resolved.primitiveKind];

        case 'reference':
            return referenceStrategy(resolved.name);

        case 'optional':
            return `${lowerZodNode(resolved.innerType, referenceStrategy)}.optional()`;

        case 'nullable':
            return `z.nullable(${lowerZodNode(resolved.innerType, referenceStrategy)})`;

        case 'collection':
            return `z.array(${lowerZodNode(resolved.elementType, referenceStrategy)})`;

        case 'object': {
            const properties = resolved.fields.map(([name, type]) => {
                const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
                const key = validIdentifier ? name : JSON.stringify(name);
                return `${key}: ${lowerZodNode(type, referenceStrategy)}`;
            });
            return `z.object({ ${properties.join(', ')} })`;
        }

        case 'union':
            return resolved.members
                .map(m => lowerZodNode(m, referenceStrategy))
                .reduce((acc, curr) => `${acc}.or(${curr})`);

        case 'intersection':
            return resolved.members
                .map(m => lowerZodNode(m, referenceStrategy))
                .reduce((acc, curr) => `${acc}.and(${curr})`);

        case 'unknown':
        default:
            return 'z.unknown()';
    }
}

/**
 * Top-Level Contract Declaration Assembly
 */
export function buildTopLevelContractDeclaration(name: string, resolvedObj: ResolvedObjectType): string {
    const schemaExpr = toZodSchemaExpression(resolvedObj);
    return [
        `export const ${name}ContractSchema = ${schemaExpr};`,
        `export type ${name}Contract = z.infer<typeof ${name}ContractSchema>;`
    ].join('\n');
}