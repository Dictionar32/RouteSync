import type { PhpAstValue, PhpBinaryOperator, PhpUnaryOperator, PhpCastType } from '../../lexer/phpAstTypes';
import { matchPhpMatchArm } from '../../lexer/phpAstAlgebra';
import type { ModelAccessorExpression } from '../../../../types/upstream/modelVocabulary';
import type { LiteralValue } from '../../../../types/upstream/primitiveVocabulary';
import type { NumberValue, StringValue, TruthValue } from '../../../../types/upstream/valueObjects';
import { matchPhpAstValue } from '../../lexer/phpAstAlgebra';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';

function binary(operator: PhpBinaryOperator) {
    const map = {
        identical: 'equal', not_identical: 'not_equal', equal: 'equal', not_equal: 'not_equal',
        greater_than: 'greater_than', less_than: 'less_than', greater_or_equal: 'greater_than_or_equal',
        less_or_equal: 'less_than_or_equal', addition: 'add', subtraction: 'subtract', multiplication: 'multiply',
        division: 'divide', modulo: 'modulo', logical_and: 'and', logical_or: 'or', concat: 'concat'
    } as const;
    return SemanticValueFactory.semanticOperator(map[operator.kind]);
}

function unary(operator: PhpUnaryOperator) {
    const map = { not: 'not', negative: 'negative', positive: 'positive', bitwise_not: 'bitwise_not' } as const;
    return { kind: 'semantic_unary_operator', value: map[operator.kind] };
}

function castType(cast: PhpCastType) {
    return { kind: 'semantic_cast', value: cast.kind };
}

function literalValue(value: string | number | boolean | null): LiteralValue {
    if (value === null) return { kind: 'null_literal' };
    if (typeof value === 'string') {
        const stringValue: StringValue = { kind: 'string_value', value };
        return { kind: 'string_literal', value: stringValue };
    }
    if (typeof value === 'number') {
        const numberValue: NumberValue = { kind: 'number_value', value };
        return { kind: 'number_literal', value: numberValue };
    }
    const truthValue: TruthValue = { kind: 'truth_value', value };
    return { kind: 'boolean_literal', value: truthValue };
}

export function mapModelAccessorReturnExpression(ast: PhpAstValue): ModelAccessorExpression {
    if (ast.kind === 'static_call' && ast.className === 'Attribute' && ast.method === 'make') {
        const getter = ast.arguments.find(argument => argument.kind === 'named' && argument.name === 'get');
        if (getter?.value.kind === 'arrow_function') return mapModelAccessorExpression(getter.value.body);
        if (getter?.value.kind === 'closure') {
            const returned = getter.value.body.statements.find(statement => statement.kind === 'return_with_value');
            if (returned?.kind === 'return_with_value') return mapModelAccessorExpression(returned.expression);
        }
    }
    return mapModelAccessorExpression(ast);
}

export function mapModelAccessorExpression(ast: PhpAstValue): ModelAccessorExpression {
    return matchPhpAstValue<ModelAccessorExpression>(ast, {
        literal: node => ({ kind: 'literal', value: literalValue(node.value) }),
        variableReference: node => ({ kind: 'variable_read', variable: SemanticValueFactory.variableName(node.name) }),
        propertyAccess: node => ({ kind: 'property_read', property: SemanticValueFactory.propertyName(node.property), receiver: mapModelAccessorExpression(node.receiver), access: node.access.kind }),
        methodChain: node => ({ kind: 'method_call', method: SemanticValueFactory.methodName(node.property), receiver: mapModelAccessorExpression(node.receiver), arguments: node.arguments.map(argument => mapModelAccessorExpression(argument.value)), access: node.access.kind }),
        arrayAccess: node => ({ kind: 'array_read', target: mapModelAccessorExpression(node.target), index: mapModelAccessorExpression(node.index) }),
        functionCall: node => ({ kind: 'function_call', functionName: SemanticValueFactory.phpFunctionName(node.functionName), arguments: node.arguments.map(argument => mapModelAccessorExpression(argument.value)) }),
        staticCall: node => ({ kind: 'static_call', className: SemanticValueFactory.className(node.className), method: SemanticValueFactory.methodName(node.method), arguments: node.arguments.map(argument => mapModelAccessorExpression(argument.value)) }),
        binaryExpression: node => ({ kind: 'binary', operator: binary(node.operator), left: mapModelAccessorExpression(node.left), right: mapModelAccessorExpression(node.right) }),
        unaryExpression: node => ({ kind: 'unary', operator: unary(node.operator), operand: mapModelAccessorExpression(node.operand) }),
        castExpression: node => ({ kind: 'cast', castType: castType(node.castType), operand: mapModelAccessorExpression(node.operand) }),
        ternaryExpression: node => ({ kind: 'ternary', condition: mapModelAccessorExpression(node.condition), truthy: mapModelAccessorExpression(node.trueBranch), falsy: mapModelAccessorExpression(node.falseBranch) }),
        shortTernary: node => ({ kind: 'short_ternary', condition: mapModelAccessorExpression(node.condition), falsy: mapModelAccessorExpression(node.falseBranch) }),
        nullCoalesce: node => ({ kind: 'binary', operator: SemanticValueFactory.semanticOperator('null_coalesce'), left: mapModelAccessorExpression(node.left), right: mapModelAccessorExpression(node.right) }),
        nestedArray: node => ({ kind: 'array_literal', entries: node.entries.map(entry => ({ kind: entry.kind, value: mapModelAccessorExpression(entry.value) })) }),
        matchExpression: node => ({ kind: 'match', subject: mapModelAccessorExpression(node.subject), arms: node.arms.map(arm => matchPhpMatchArm(arm, {
            conditional: item => ({ kind: 'conditional', conditions: item.conditions.map(mapModelAccessorExpression), value: mapModelAccessorExpression(item.value) }),
            default: item => ({ kind: 'default', value: mapModelAccessorExpression(item.value) })
        })) }),
        classReference: node => ({ kind: 'class_reference', className: SemanticValueFactory.className(node.className) }),
        resourceSingle: node => ({ kind: 'resource', resourceName: SemanticValueFactory.className(node.resourceName), argument: mapModelAccessorExpression(node.argument) }),
        resourceCollection: node => ({ kind: 'resource_collection', resourceName: SemanticValueFactory.className(node.resourceName), argument: mapModelAccessorExpression(node.argument) }),
        closure: () => ({ kind: 'rejected', reason: 'unsupported_syntax' }),
        arrowFunction: () => ({ kind: 'rejected', reason: 'unsupported_syntax' }),
        unsupported: () => ({ kind: 'rejected', reason: 'unsupported_syntax' })
    });
}
