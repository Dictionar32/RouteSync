import type { PhpAstValue, PhpBinaryOperator, PhpUnaryOperator, PhpCastType } from '../../lexer/phpAstTypes';
import { matchPhpMatchArm } from '../../lexer/phpAstAlgebra';
import type { ModelAccessorExpression } from '../../../../types/upstream/modelVocabulary';
import type { LiteralValue } from '../../../../types/upstream/primitiveVocabulary';
import type { NumberValue, StringValue, TruthValue } from '../../../../types/upstream/valueObjects';
import { matchPhpAstValue } from '../../lexer/phpAstAlgebra';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import {
    relationAll,
    relationAny,
    relationEqual,
    relationGate,
    relationFirstOption,
    relationOptionFold,
    relationProject,
    relationSome,
    relationNone,
    type RelationOption,
} from '../../../../semantic/kernel/relationalSequence';

const binaryOperatorRelation = (
    operator: PhpBinaryOperator,
): ReturnType<typeof SemanticValueFactory.semanticOperator> => {
    const entries = [
        ['identical', 'equal'],
        ['not_identical', 'not_equal'],
        ['equal', 'equal'],
        ['not_equal', 'not_equal'],
        ['greater_than', 'greater_than'],
        ['less_than', 'less_than'],
        ['greater_or_equal', 'greater_than_or_equal'],
        ['less_or_equal', 'less_than_or_equal'],
        ['addition', 'add'],
        ['subtraction', 'subtract'],
        ['multiplication', 'multiply'],
        ['division', 'divide'],
        ['modulo', 'modulo'],
        ['logical_and', 'and'],
        ['logical_or', 'or'],
        ['concat', 'concat'],
    ] as const;
    const hit = relationFirstOption(entries, entry => relationEqual(entry[0], operator.kind));
    return relationOptionFold(hit, () => SemanticValueFactory.semanticOperator('concat'), entry => SemanticValueFactory.semanticOperator(entry[1]));
};

const unaryOperatorRelation = (operator: PhpUnaryOperator) => {
    const entries = [
        ['not', 'not'],
        ['negative', 'negative'],
        ['positive', 'positive'],
        ['bitwise_not', 'bitwise_not'],
    ] as const;
    const hit = relationFirstOption(entries, entry => relationEqual(entry[0], operator.kind));
    return relationOptionFold(hit, () => ({ kind: 'semantic_unary_operator', value: 'not' as const }), entry => ({ kind: 'semantic_unary_operator', value: entry[1] }));
};

const castTypeRelation = (cast: PhpCastType) => ({ kind: 'semantic_cast' as const, value: cast.kind });

function literalValue(value: unknown): LiteralValue {
    return relationGate(
        relationEqual(typeof value, 'object'),
        () => ({ kind: 'null_literal' }),
        () => relationGate(
            relationEqual(typeof value, 'string'),
            () => ({ kind: 'string_literal', value: { kind: 'string_value', value: value as string } as StringValue }),
            () => relationGate(
                relationEqual(typeof value, 'number'),
                () => ({ kind: 'number_literal', value: { kind: 'number_value', value: value as number } as NumberValue }),
                () => ({ kind: 'boolean_literal', value: { kind: 'truth_value', value: value as boolean } as TruthValue }),
            ),
        ),
    );
}

const getterArgument = (ast: Extract<PhpAstValue, { kind: 'static_call' }>): RelationOption<Extract<typeof ast.arguments[number], { kind: 'named' }>> =>
    relationFirstOption(
        ast.arguments,
        argument => relationAll([
            relationEqual(argument.kind, 'named'),
            relationEqual((argument as Extract<typeof argument, { kind: 'named' }>).name, 'get'),
        ]),
    ) as RelationOption<Extract<typeof ast.arguments[number], { kind: 'named' }>>;

export function resolveModelAccessorReturnExpression(ast: PhpAstValue): ModelAccessorExpression {
    const isAttributeMake = relationAll([
        relationEqual(ast.kind, 'static_call'),
        relationEqual((ast as Extract<PhpAstValue, { kind: 'static_call' }>).className, 'Attribute'),
        relationEqual((ast as Extract<PhpAstValue, { kind: 'static_call' }>).method, 'make'),
    ]);
    return relationGate(
        isAttributeMake,
        () => relationOptionFold(
            getterArgument(ast as Extract<PhpAstValue, { kind: 'static_call' }>),
            () => mapModelAccessorExpression(ast),
            getter => relationGate(
                relationEqual(getter.value.kind, 'arrow_function'),
                () => mapModelAccessorExpression(getter.value.body),
                () => relationGate(
                    relationEqual(getter.value.kind, 'closure'),
                    () => relationOptionFold(
                        relationFirstOption(getter.value.body.statements, statement => relationEqual(statement.kind, 'return_with_value')) as RelationOption<Extract<typeof getter.value.body.statements[number], { kind: 'return_with_value' }>>,
                        () => mapModelAccessorExpression(ast),
                        returned => mapModelAccessorExpression(returned.expression),
                    ),
                    () => mapModelAccessorExpression(ast),
                ),
            ),
        ),
        () => mapModelAccessorExpression(ast),
    );
}

export function mapModelAccessorExpression(ast: PhpAstValue): ModelAccessorExpression {
    return matchPhpAstValue<ModelAccessorExpression>(ast, {
        literal: node => ({ kind: 'literal', value: literalValue(node.value) }),
        variableReference: node => ({ kind: 'variable_read', variable: SemanticValueFactory.variableName(node.name) }),
        propertyAccess: node => ({ kind: 'property_read', property: SemanticValueFactory.propertyName(node.property), receiver: mapModelAccessorExpression(node.receiver), access: node.access.kind }),
        methodChain: node => ({ kind: 'method_call', method: SemanticValueFactory.methodName(node.property), receiver: mapModelAccessorExpression(node.receiver), arguments: relationProject(node.arguments, argument => mapModelAccessorExpression(argument.value)) , access: node.access.kind }),
        arrayAccess: node => ({ kind: 'array_read', target: mapModelAccessorExpression(node.target), index: mapModelAccessorExpression(node.index) }),
        functionCall: node => ({ kind: 'function_call', functionName: SemanticValueFactory.phpFunctionName(node.functionName), arguments: relationProject(node.arguments, argument => mapModelAccessorExpression(argument.value)) }),
        staticCall: node => ({ kind: 'static_call', className: SemanticValueFactory.className(node.className), method: SemanticValueFactory.methodName(node.method), arguments: relationProject(node.arguments, argument => mapModelAccessorExpression(argument.value)) }),
        binaryExpression: node => ({ kind: 'binary', operator: binaryOperatorRelation(node.operator), left: mapModelAccessorExpression(node.left), right: mapModelAccessorExpression(node.right) }),
        unaryExpression: node => ({ kind: 'unary', operator: unaryOperatorRelation(node.operator), operand: mapModelAccessorExpression(node.operand) }),
        castExpression: node => ({ kind: 'cast', castType: castTypeRelation(node.castType), operand: mapModelAccessorExpression(node.operand) }),
        ternaryExpression: node => ({ kind: 'ternary', condition: mapModelAccessorExpression(node.condition), truthy: mapModelAccessorExpression(node.trueBranch), falsy: mapModelAccessorExpression(node.falseBranch) }),
        shortTernary: node => ({ kind: 'short_ternary', condition: mapModelAccessorExpression(node.condition), falsy: mapModelAccessorExpression(node.falseBranch) }),
        nullCoalesce: node => ({ kind: 'binary', operator: SemanticValueFactory.semanticOperator('null_coalesce'), left: mapModelAccessorExpression(node.left), right: mapModelAccessorExpression(node.right) }),
        nestedArray: node => ({ kind: 'array_literal', entries: relationProject(node.entries, entry => ({ kind: entry.kind, value: mapModelAccessorExpression(entry.value) })) }),
        matchExpression: node => ({ kind: 'match', subject: mapModelAccessorExpression(node.subject), arms: relationProject(node.arms, arm => matchPhpMatchArm(arm, {
            conditional: item => ({ kind: 'conditional', conditions: relationProject(item.conditions, mapModelAccessorExpression), value: mapModelAccessorExpression(item.value) }),
            default: item => ({ kind: 'default', value: mapModelAccessorExpression(item.value) }),
        })) }),
        classReference: node => ({ kind: 'class_reference', className: SemanticValueFactory.className(node.className) }),
        resourceSingle: node => ({ kind: 'resource', resourceName: SemanticValueFactory.className(node.resourceName), argument: mapModelAccessorExpression(node.argument) }),
        resourceCollection: node => ({ kind: 'resource_collection', resourceName: SemanticValueFactory.className(node.resourceName), argument: mapModelAccessorExpression(node.argument) }),
        closure: () => ({ kind: 'rejected', reason: 'unsupported_syntax' }),
        arrowFunction: () => ({ kind: 'rejected', reason: 'unsupported_syntax' }),
        unsupported: () => ({ kind: 'rejected', reason: 'unsupported_syntax' }),
    });
}
