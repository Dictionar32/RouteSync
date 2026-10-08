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
    type ResolvedSemanticType,
    type ResolvedObjectType,
    type ResolvedPrimitiveKind,
    matchResolvedSemanticType
} from './ResolvedSemanticType';
import { relationFold, relationProject, relationResolve, relationSlice } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';

export type ReferenceResolutionStrategy = (name: string) => string;

export const NAMED_SCHEMA_STRATEGY: ReferenceResolutionStrategy = (name: string) => `${name}Schema`;
export const UNKNOWN_REFERENCE_STRATEGY: ReferenceResolutionStrategy = () => 'z.unknown()';

export interface ZodLowererOptions {
    readonly referenceStrategy?: ReferenceResolutionStrategy;
}


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
    return matchResolvedSemanticType(resolved, {
        primitive: type => ZOD_PRIMITIVES[type.primitiveKind],
        reference: type => referenceStrategy(type.name),
        optional: type => `${lowerZodNode(type.innerType, referenceStrategy)}.optional()`,
        nullable: type => `z.nullable(${lowerZodNode(type.innerType, referenceStrategy)})`,
        collection: type => `z.array(${lowerZodNode(type.elementType, referenceStrategy)})`,
        object: type => lowerZodObject(type, referenceStrategy),
        union: type => foldSchemas(type.members, referenceStrategy, '.or(', 'union'),
        intersection: type => foldSchemas(type.members, referenceStrategy, '.and(', 'intersection'),
        unknown: () => 'z.unknown()',
    });
}

const lowerZodObject = (
    resolved: ResolvedObjectType,
    referenceStrategy: ReferenceResolutionStrategy
): string => {
    const properties = relationProject(resolved.fields, ({ name, type, presence }) => {
        const propertyName = name.value.value;
        const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propertyName);
        const key = relationResolve(validIdentifier, () => propertyName, () => JSON.stringify(propertyName));
        const schema = lowerZodNode(type, referenceStrategy);
        const value = relationResolve(relationEqual(presence.kind, 'optional'), () => `${schema}.optional()`, () => schema);
        return `${key}: ${value}`;
    });
    return `z.object({ ${properties.join(', ')} })`;
};


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