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
import { resolveZodLoweringOperation } from './zodSemanticRelations';
import { relationFold, relationProject, relationResolve, relationSlice } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';

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
    unknown: 'z.unknown()',
    unspecified: 'z.unknown()'
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
    const operation = resolveZodLoweringOperation(resolved.kind);
    return ZOD_LOWERERS[operation](resolved, referenceStrategy);
}

type ZodLowererRegistry = {
    readonly [K in ResolvedSemanticType['kind']]: (resolved: Extract<ResolvedSemanticType, { kind: K }>, referenceStrategy: ReferenceResolutionStrategy) => string;
};

const ZOD_LOWERERS: ZodLowererRegistry = Object.freeze({
    primitive: resolved => ZOD_PRIMITIVES[resolved.primitiveKind],
    reference: (resolved, referenceStrategy) => referenceStrategy(resolved.name),
    optional: (resolved, referenceStrategy) => `${lowerZodNode(resolved.innerType, referenceStrategy)}.optional()`,
    nullable: (resolved, referenceStrategy) => `z.nullable(${lowerZodNode(resolved.innerType, referenceStrategy)})`,
    collection: (resolved, referenceStrategy) => `z.array(${lowerZodNode(resolved.elementType, referenceStrategy)})`,
    object: (resolved, referenceStrategy) => {
        const properties = relationProject(resolved.fields, ({ name, type, presence }) => {
            const propertyName = name.value.value;
            const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propertyName);
            const key = relationResolve(validIdentifier, () => propertyName, () => JSON.stringify(propertyName));
            const schema = lowerZodNode(type, referenceStrategy);
            const value = relationResolve(relationEqual(presence.kind, 'optional'), () => `${schema}.optional()`, () => schema);
            return `${key}: ${value}`;
        });
        return `z.object({ ${properties.join(', ')} })`;
    },
    union: (resolved, referenceStrategy) => foldSchemas(resolved.members, referenceStrategy, '.or(', 'union'),
    intersection: (resolved, referenceStrategy) => foldSchemas(resolved.members, referenceStrategy, '.and(', 'intersection'),
    unknown: () => 'z.unknown()',
});


function foldSchemas(members: readonly ResolvedSemanticType[], referenceStrategy: ReferenceResolutionStrategy, operator: string, kind: string): string {
    return relationResolve(
        members.length > 0,
        () => {
            const first = lowerZodNode(members[0], referenceStrategy);
            return relationFold(relationSlice(members, 1, members.length), first, (accumulator, member) => `${accumulator}${operator}${lowerZodNode(member, referenceStrategy)})`);
        },
        () => { throw Error(`Cannot lower empty ${kind} semantic type`); },
    );
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