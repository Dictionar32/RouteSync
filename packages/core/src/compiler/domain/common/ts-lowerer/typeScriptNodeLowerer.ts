/**
 * Relation-driven lowering of resolved semantic types to TypeScript syntax.
 * Semantic dispatch is performed by the resolved-type catamorphism; formatting
 * decisions are relation projections rather than host control flow.
 */
import type { ResolvedSemanticType, ResolvedObjectType } from '../ResolvedSemanticType';
import { matchResolvedSemanticType } from '../ResolvedSemanticType';
import type { TypeScriptLowererOptions } from './typeScriptVocabulary';
import { resolveTypeScriptLoweringFromType } from './typeScriptLoweringSemanticRelations';
import { resolveTypeScriptPrimitiveToken } from './typeScriptPrimitiveSemanticRelations';
import type { ResolvedPrimitiveKind } from '../resolved-types';
import { relationProject, relationResolve, relationFirstOption, relationOptionFold } from '../../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { resolveTypeScriptSurfaceToken } from './typeScriptTargetSurfaceRelations';
import { TypeScriptSyntax } from './typeScriptSyntax';

type LoweringContext = Readonly<{
    readonly singleLine: boolean;
    readonly indentLevel: number;
}>;

const lowerPrimitive = (primitiveKind: ResolvedPrimitiveKind): string =>
    resolveTypeScriptPrimitiveToken(primitiveKind);

const lowerReference = (name: string): string => name;

const lowerOptional = (innerType: ResolvedSemanticType, context: LoweringContext): string =>
    `${lowerTypeScriptNode(innerType, context.singleLine, context.indentLevel)}${resolveTypeScriptSurfaceToken('optional_type')}`;

const lowerNullable = (innerType: ResolvedSemanticType, context: LoweringContext): string =>
    `${lowerTypeScriptNode(innerType, context.singleLine, context.indentLevel)}${resolveTypeScriptSurfaceToken('nullable_type')}`;

const unionLike = (type: ResolvedSemanticType): boolean =>
    relationResolve(relationEqual(type.kind, 'union'), () => true, () => relationEqual(type.kind, 'intersection'));

const lowerCollection = (elementType: ResolvedSemanticType, context: LoweringContext): string => {
    const inner = lowerTypeScriptNode(elementType, context.singleLine, context.indentLevel);
    return relationResolve(unionLike(elementType), () => `(${inner})${resolveTypeScriptSurfaceToken('array_type')}`, () => `${inner}${resolveTypeScriptSurfaceToken('array_type')}`);
};

const lowerObject = (resolved: ResolvedObjectType, context: LoweringContext): string =>
    relationOptionFold(
        relationFirstOption(resolved.fields, () => true),
        () => 'object',
        () => `{ ${relationProject(resolved.fields, ({ name, type, presence }) => {
            const propertyName = relationResolve(
                relationEqual(presence.kind, 'optional'),
                () => `${name.value.value}${resolveTypeScriptSurfaceToken('optional_property')}`,
                () => name.value.value,
            );
            return `${propertyName}: ${lowerTypeScriptNode(type, context.singleLine, context.indentLevel)};`;
        }).join(' ')} }`,
    );

const lowerUnion = (members: readonly ResolvedSemanticType[], context: LoweringContext): string =>
    relationProject(members, member => lowerTypeScriptNode(member, context.singleLine, context.indentLevel)).join(' | ');

const lowerIntersection = (members: readonly ResolvedSemanticType[], context: LoweringContext): string =>
    relationProject(members, member => lowerTypeScriptNode(member, context.singleLine, context.indentLevel)).join(' & ');

const lowerUnknown = (): string => 'unknown';

export function lowerTypeScriptNode(
    resolved: ResolvedSemanticType,
    singleLine: boolean,
    indentLevel: number,
): string {
    const operation = resolveTypeScriptLoweringFromType(resolved.kind).operation;
    return matchResolvedSemanticType(resolved, {
        primitive: type => relationResolve(relationEqual(operation, 'primitive'), () => lowerPrimitive(type.primitiveKind), () => lowerUnknown()),
        reference: type => relationResolve(relationEqual(operation, 'reference'), () => lowerReference(type.name), () => lowerUnknown()),
        optional: type => relationResolve(relationEqual(operation, 'optional'), () => lowerOptional(type.innerType, { singleLine, indentLevel }), () => lowerUnknown()),
        nullable: type => relationResolve(relationEqual(operation, 'nullable'), () => lowerNullable(type.innerType, { singleLine, indentLevel }), () => lowerUnknown()),
        collection: type => relationResolve(relationEqual(operation, 'collection'), () => lowerCollection(type.elementType, { singleLine, indentLevel }), () => lowerUnknown()),
        object: type => relationResolve(relationEqual(operation, 'object'), () => lowerObject(type, { singleLine, indentLevel }), () => lowerUnknown()),
        union: type => relationResolve(relationEqual(operation, 'union'), () => lowerUnion(type.members, { singleLine, indentLevel }), () => lowerUnknown()),
        intersection: type => relationResolve(relationEqual(operation, 'intersection'), () => lowerIntersection(type.members, { singleLine, indentLevel }), () => lowerUnknown()),
        unknown: () => lowerUnknown(),
    });
}

export function toTypeScriptTypeExpression(
    resolved: ResolvedSemanticType,
    { singleLine = false, indentLevel = 0 }: TypeScriptLowererOptions = {},
): string {
    return lowerTypeScriptNode(resolved, singleLine, indentLevel);
}

export function buildTopLevelDeclaration(name: string, resolvedObj: ResolvedObjectType): string {
    const properties = relationProject(resolvedObj.fields, ({ name: propName, type: propType, presence }) => {
        const propertyName = relationResolve(
            relationEqual(presence.kind, 'optional'),
            () => `${propName.value.value}${resolveTypeScriptSurfaceToken('optional_property')}`,
            () => propName.value.value,
        );
        return `  ${propertyName}: ${lowerTypeScriptNode(propType, true, 1)};`;
    }).join('\n');
    return `export interface ${name} {\n${properties}\n}`;
}
