/**
 * literalTernaryBinders.ts
 *
 * Binders for literals, ternary expressions, and raw expression fallbacks.
 *
 * @module core/compiler/scanner/binders/resource/composite
 */

import type { OriginModelSymbol, ModelSymbolTable } from "../../../symbols/ModelSymbolTable";
import type { PhpAstValue } from "../../../lexer/PhpAst";
import { ResourceFieldExpressionFactory } from "../../../../../types/route";
import { BoundSemanticFactory } from "../../../../../types/domain/boundAst";
import { SemanticValueFactory } from "../../../../../types/domain/semanticValues";
import { ScannedResourceFieldDescriptor } from "../../../descriptors/resourceDescriptors";
import { ErrorType, PrimitiveKind, PrimitiveType } from "../../../../types/SemanticType";
import { toCamelCase } from "../../../../../utils/resource-naming";
import type { BoundResourceFieldResult } from "../../SemanticResourceBinder";

export function bindLiteralField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'literal' }>
): BoundResourceFieldResult {
    const literalType = typeof value.value === 'number'
        ? 'number'
        : typeof value.value === 'boolean'
            ? 'boolean'
            : 'string';

    const primKind = literalType === 'number'
        ? PrimitiveKind.NUMBER
        : literalType === 'boolean'
            ? PrimitiveKind.BOOLEAN
            : PrimitiveKind.STRING;

    const boundAst = BoundSemanticFactory.primitive(
        new PrimitiveType(primKind),
        value.literalType === 'null'
            ? { kind: 'null' }
            : value.literalType === 'number'
                ? { kind: 'number', value: value.value }
                : value.literalType === 'boolean'
                    ? { kind: 'boolean', value: value.value }
                    : { kind: 'string', value: value.value }
    );
    const literal = value.literalType === 'number'
        ? { kind: 'number' as const, value: value.value }
        : value.literalType === 'boolean'
            ? { kind: 'boolean' as const, value: value.value }
            : value.literalType === 'null'
                ? { kind: 'null' as const, value: null }
                : { kind: 'string' as const, value: value.value };
    const expression = ResourceFieldExpressionFactory.literal(literal);
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        new PrimitiveType(primKind),
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}


export function bindShortTernaryField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'short_ternary' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: (params: {
        readonly key: string;
        readonly value: PhpAstValue;
        readonly modelSymbol: OriginModelSymbol;
        readonly modelSymbolTable: ModelSymbolTable;
    }) => BoundResourceFieldResult
): BoundResourceFieldResult {
    const condition = bindFieldFn({ key, value: value.condition, modelSymbol, modelSymbolTable });
    const falsy = bindFieldFn({ key, value: value.falseBranch, modelSymbol, modelSymbolTable });
    const semanticType = condition.descriptor.semantic.kind === 'verified'
        ? condition.descriptor.semantic.type
        : falsy.descriptor.semantic.kind === 'verified'
            ? falsy.descriptor.semantic.type
            : new ErrorType('Short ternary branches could not be semantically resolved');
    const boundAst = BoundSemanticFactory.ternary({
        conditionExpression: SemanticValueFactory.conditionExpression(value.condition.kind),
        truthy: condition.boundAst,
        falsy: falsy.boundAst,
        resultingType: semanticType,
    });
    const expression = ResourceFieldExpressionFactory.shortTernary(
        condition.descriptor.expression,
        falsy.descriptor.expression,
    );
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key, expression, semanticType, toCamelCase(key), boundAst,
    );
    return { descriptor, boundAst };
}

export function bindCastField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'cast_expression' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: (params: {
        readonly key: string;
        readonly value: PhpAstValue;
        readonly modelSymbol: OriginModelSymbol;
        readonly modelSymbolTable: ModelSymbolTable;
    }) => BoundResourceFieldResult
): BoundResourceFieldResult {
    const operand = bindFieldFn({ key, value: value.operand, modelSymbol, modelSymbolTable });
    const semanticType = value.castType.kind === 'int' || value.castType.kind === 'float'
        ? new PrimitiveType(PrimitiveKind.NUMBER)
        : value.castType.kind === 'bool'
            ? new PrimitiveType(PrimitiveKind.BOOLEAN)
            : value.castType.kind === 'string'
                ? new PrimitiveType(PrimitiveKind.STRING)
                : operand.descriptor.semantic.kind === 'verified'
                    ? operand.descriptor.semantic.type
                    : new ErrorType('Cast operand could not be semantically resolved');
    const expression = ResourceFieldExpressionFactory.typeCast(
        SemanticValueFactory.castTypeName(value.castType.kind),
        operand.descriptor.expression,
    );
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key, expression, semanticType, toCamelCase(key), operand.boundAst,
    );
    return { descriptor, boundAst: operand.boundAst };
}

export function bindTernaryField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'ternary_expression' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: (params: {
        readonly key: string;
        readonly value: PhpAstValue;
        readonly modelSymbol: OriginModelSymbol;
        readonly modelSymbolTable: ModelSymbolTable;
    }) => BoundResourceFieldResult
): BoundResourceFieldResult {
    const trueBranch = bindFieldFn({
        key,
        value: value.trueBranch,
        modelSymbol,
        modelSymbolTable
    });

    const falseBranch = bindFieldFn({
        key,
        value: value.falseBranch,
        modelSymbol,
        modelSymbolTable
    });

    const semanticType = trueBranch.descriptor.semantic.kind === 'verified'
        ? trueBranch.descriptor.semantic.type
        : falseBranch.descriptor.semantic.kind === 'verified'
            ? falseBranch.descriptor.semantic.type
            : new ErrorType('Ternary branches could not be semantically resolved');

    const boundAst = BoundSemanticFactory.ternary({
        conditionExpression: SemanticValueFactory.conditionExpression(value.condition.kind),
        truthy: trueBranch.boundAst,
        falsy: falseBranch.boundAst,
        resultingType: semanticType,
    });

    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        trueBranch.descriptor.expression,
        semanticType,
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}


export function bindBinaryField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'binary_expression' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: (params: {
        readonly key: string;
        readonly value: PhpAstValue;
        readonly modelSymbol: OriginModelSymbol;
        readonly modelSymbolTable: ModelSymbolTable;
    }) => BoundResourceFieldResult
): BoundResourceFieldResult {
    const left = bindFieldFn({ key, value: value.left, modelSymbol, modelSymbolTable });
    const right = bindFieldFn({ key, value: value.right, modelSymbol, modelSymbolTable });
    if (left.descriptor.semantic.kind !== 'verified' || right.descriptor.semantic.kind !== 'verified') {
        return bindFallbackField(key);
    }
    const operator = {
        kind: 'semantic_operator' as const,
        value: value.operator.kind === 'addition' ? 'add' :
            value.operator.kind === 'subtraction' ? 'subtract' :
            value.operator.kind === 'multiplication' ? 'multiply' :
            value.operator.kind === 'division' ? 'divide' :
            value.operator.kind === 'modulo' ? 'modulo' :
            value.operator.kind === 'equal' || value.operator.kind === 'identical' ? 'equal' :
            value.operator.kind === 'not_equal' || value.operator.kind === 'not_identical' ? 'not_equal' :
            value.operator.kind === 'less_than' ? 'less_than' :
            value.operator.kind === 'less_or_equal' ? 'less_than_or_equal' :
            value.operator.kind === 'greater_than' ? 'greater_than' :
            value.operator.kind === 'greater_or_equal' ? 'greater_than_or_equal' :
            value.operator.kind === 'logical_and' ? 'and' :
            value.operator.kind === 'logical_or' ? 'or' :
            'concat'
    };
    const numeric = operator.value === 'add' || operator.value === 'subtract' || operator.value === 'multiply' || operator.value === 'divide' || operator.value === 'modulo';
    const comparison = operator.value === 'equal' || operator.value === 'not_equal' || operator.value === 'less_than' || operator.value === 'less_than_or_equal' || operator.value === 'greater_than' || operator.value === 'greater_than_or_equal' || operator.value === 'and' || operator.value === 'or';
    const resultingType = numeric ? new PrimitiveType(PrimitiveKind.NUMBER) : comparison ? new PrimitiveType(PrimitiveKind.BOOLEAN) : left.descriptor.semantic.type;
    const expression = ResourceFieldExpressionFactory.binary(operator, left.descriptor.expression, right.descriptor.expression);
    const boundAst = BoundSemanticFactory.binary({ operator, left: left.boundAst, right: right.boundAst, resultingType });
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(key, expression, resultingType, toCamelCase(key), boundAst);
    return { descriptor, boundAst };
}

export function bindNullCoalesceField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'null_coalesce' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: (params: {
        readonly key: string;
        readonly value: PhpAstValue;
        readonly modelSymbol: OriginModelSymbol;
        readonly modelSymbolTable: ModelSymbolTable;
    }) => BoundResourceFieldResult
): BoundResourceFieldResult {
    const left = bindFieldFn({ key, value: value.left, modelSymbol, modelSymbolTable });
    const right = bindFieldFn({ key, value: value.right, modelSymbol, modelSymbolTable });
    if (left.descriptor.semantic.kind !== 'verified' || right.descriptor.semantic.kind !== 'verified') {
        return bindFallbackField(key);
    }
    const operator = { kind: 'semantic_operator' as const, value: 'null_coalesce' as const };
    const resultingType = left.descriptor.semantic.type.isNullable() ? right.descriptor.semantic.type : left.descriptor.semantic.type;
    const expression = ResourceFieldExpressionFactory.binary(operator, left.descriptor.expression, right.descriptor.expression);
    const boundAst = BoundSemanticFactory.binary({ operator, left: left.boundAst, right: right.boundAst, resultingType });
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(key, expression, resultingType, toCamelCase(key), boundAst);
    return { descriptor, boundAst };
}

export function bindFallbackField(key: string): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unsupported('unsupported_syntax');
    const expression = ResourceFieldExpressionFactory.unsupported('unsupported_syntax');
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        new ErrorType('Resource expression requires semantic binding before a type can be assigned'),
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}
