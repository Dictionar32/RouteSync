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
import { ScannedResourceFieldDescriptor } from "../../../descriptors/resourceDescriptors";
import { PrimitiveKind } from "../../../../types/SemanticType";
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

    const boundAst = BoundSemanticFactory.primitive(literalType, value.value, false);
    const expression = ResourceFieldExpressionFactory.literal(value.value);
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        false,
        toCamelCase(key),
        primKind,
        boundAst
    );

    return { descriptor, boundAst };
}

export function bindTernaryField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'ternary_expression' }>,
    modelSymbol: OriginModelSymbol | undefined,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: (params: {
        readonly key: string;
        readonly value: PhpAstValue;
        readonly rawExpression: string;
        readonly modelSymbol?: OriginModelSymbol;
        readonly modelSymbolTable: ModelSymbolTable;
    }) => BoundResourceFieldResult
): BoundResourceFieldResult {
    const trueBranch = bindFieldFn({
        key,
        value: value.trueBranch,
        rawExpression: '',
        modelSymbol,
        modelSymbolTable
    });

    const falseBranch = bindFieldFn({
        key,
        value: value.falseBranch,
        rawExpression: '',
        modelSymbol,
        modelSymbolTable
    });

    const resultingType = trueBranch.descriptor.expression.kind === 'primitive'
        ? (trueBranch.descriptor.expression as any).type
        : 'unknown';

    const boundAst = BoundSemanticFactory.ternary({
        conditionExpression: value.condition,
        truthy: trueBranch.boundAst,
        falsy: falseBranch.boundAst,
        resultingType,
        nullable: trueBranch.descriptor.nullable || falseBranch.descriptor.nullable
    });

    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        trueBranch.descriptor.expression,
        boundAst.nullable,
        toCamelCase(key),
        trueBranch.descriptor.semanticType,
        boundAst
    );

    return { descriptor, boundAst };
}

export function bindFallbackField(key: string, rawExpression: string): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unknown(rawExpression, 'Unresolved raw expression');
    const expression = ResourceFieldExpressionFactory.primitive('string');
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        false,
        toCamelCase(key),
        PrimitiveKind.STRING,
        boundAst
    );

    return { descriptor, boundAst };
}
