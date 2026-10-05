/**
 * Declarative semantic relations for TypeExpression -> SemanticType projection.
 *
 * The relation program owns semantic classification. The executor only consumes
 * the derived projection operation and invokes the corresponding constructor.
 */
import {
    solveSemanticRelations,
    type SemanticRelation,
    type SemanticRelationRewrite,
} from '../../../semantic/foundation/semanticRewriteEngine';
import type { PrimitiveVocabulary } from '../../../types/upstream/primitiveVocabulary';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import { relationAny, relationAll, relationEqual } from '../../../semantic/foundation/semanticRelations';
import { relationFirst, relationOptionFold, relationProject } from '../../../semantic/foundation/relationalSequence';

export type TypeExpressionProjection =
    | 'primitive'
    | 'reference'
    | 'array'
    | 'array_map'
    | 'mixed'
    | 'union'
    | 'intersection'
    | 'nullable'
    | 'optional'
    | 'uninhabited'
    | 'error'
    | 'object'
    | 'generic'
    | 'callable';

export type PrimitiveProjection =
    | 'string'
    | 'number'
    | 'boolean'
    | 'date_time'
    | 'file'
    | 'json'
    | 'unspecified';

export type TypeExpressionSemanticRelation =
    | 'type_expression_kind'
    | 'type_expression_projection'
    | 'primitive_kind'
    | 'primitive_projection';

const projectionRules = (
    ...entries: readonly [string, TypeExpressionProjection][]
): readonly SemanticRelationRewrite<TypeExpressionSemanticRelation>[] =>
    Object.freeze(relationProject(entries, ([kind, projection], index) => Object.freeze({
        id: `type-expression-${kind}-projection`,
        priority: entries.length - index,
        when: [{ relation: 'type_expression_kind' as const, arguments: [kind] }],
        then: [{ relation: 'type_expression_projection' as const, arguments: [kind, projection] }],
    })));

export const TYPE_EXPRESSION_PROJECTION_RULES = projectionRules(
    ['primitive', 'primitive'],
    ['reference', 'reference'],
    ['array', 'array'],
    ['array_map', 'array_map'],
    ['mixed', 'mixed'],
    ['union', 'union'],
    ['intersection', 'intersection'],
    ['nullable', 'nullable'],
    ['optional', 'optional'],
    ['uninhabited', 'uninhabited'],
    ['error', 'error'],
    ['object', 'object'],
    ['generic', 'generic'],
    ['callable', 'callable'],
);

const primitiveRules = (
    ...entries: readonly [PrimitiveProjection, PrimitiveProjection][]
): readonly SemanticRelationRewrite<TypeExpressionSemanticRelation>[] =>
    Object.freeze(relationProject(entries, ([kind, projection], index) => Object.freeze({
        id: `primitive-${kind}-projection`,
        priority: entries.length - index,
        when: [{ relation: 'primitive_kind' as const, arguments: [kind] }],
        then: [{ relation: 'primitive_projection' as const, arguments: [kind, projection] }],
    })));

export const PRIMITIVE_PROJECTION_RULES = primitiveRules(
    ['string', 'string'],
    ['number', 'number'],
    ['boolean', 'boolean'],
    ['date_time', 'date_time'],
    ['file', 'file'],
    ['json', 'json'],
    ['unspecified', 'unspecified'],
);

export const resolveTypeExpressionProjection = (type: TypeExpression): TypeExpressionProjection => {
    const solved = solveSemanticRelations<TypeExpressionSemanticRelation>(
        [{ relation: 'type_expression_kind', arguments: [type.kind] }],
        TYPE_EXPRESSION_PROJECTION_RULES,
    );
    const projection = relationFirst(
        solved,
        fact => relationAll([
            relationEqual(fact.relation, 'type_expression_projection'),
            relationEqual(fact.arguments[0], type.kind),
        ]),
    );
    return relationOptionFold(
        projection,
        () => { throw Error(`No semantic projection rule for TypeExpression kind '${type.kind}'`); },
        fact => relationOptionFold(
            relationFirst([fact.arguments[1]], argument => relationAny([
                relationEqual(argument, 'primitive'), relationEqual(argument, 'reference'), relationEqual(argument, 'array'),
                relationEqual(argument, 'array_map'), relationEqual(argument, 'mixed'), relationEqual(argument, 'union'),
                relationEqual(argument, 'intersection'), relationEqual(argument, 'nullable'), relationEqual(argument, 'optional'),
                relationEqual(argument, 'uninhabited'), relationEqual(argument, 'error'), relationEqual(argument, 'object'),
                relationEqual(argument, 'generic'), relationEqual(argument, 'callable'),
            ])),
            () => { throw Error(`Invalid semantic projection witness for TypeExpression kind '${type.kind}'`); },
            argument => argument as TypeExpressionProjection,
        ),
    );
};

export const resolvePrimitiveProjection = (primitive: PrimitiveVocabulary): PrimitiveProjection => {
    const solved = solveSemanticRelations<TypeExpressionSemanticRelation>(
        [{ relation: 'primitive_kind', arguments: [primitive.kind] }],
        PRIMITIVE_PROJECTION_RULES,
    );
    const projection = relationFirst(
        solved,
        fact => relationAll([
            relationEqual(fact.relation, 'primitive_projection'),
            relationEqual(fact.arguments[0], primitive.kind),
        ]),
    );
    return relationOptionFold(
        projection,
        () => { throw Error(`No semantic projection rule for primitive kind '${primitive.kind}'`); },
        fact => relationOptionFold(
            relationFirst([fact.arguments[1]], argument => relationAny([
                relationEqual(argument, 'string'), relationEqual(argument, 'number'), relationEqual(argument, 'boolean'),
                relationEqual(argument, 'date_time'), relationEqual(argument, 'file'), relationEqual(argument, 'json'),
                relationEqual(argument, 'unspecified'),
            ])),
            () => { throw Error(`Invalid primitive projection witness for '${primitive.kind}'`); },
            argument => argument as PrimitiveProjection,
        ),
    );
};
