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
import { PrimitiveKind, PrimitiveType } from "../../../../types/SemanticType";
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
            ? { kind: 'null', value: null }
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

export function bindTernaryField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'ternary_expression' }>,
    modelSymbol: OriginModelSymbol | undefined,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: (params: {
        readonly key: string;
        readonly value: PhpAstValue;
        readonly modelSymbol?: OriginModelSymbol;
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

    const boundAst = BoundSemanticFactory.ternary({
        conditionExpression: value.condition.kind,
        truthy: trueBranch.boundAst,
        falsy: falseBranch.boundAst,
        resultingType: trueBranch.descriptor.semantic.type,
    });

    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        trueBranch.descriptor.expression,
        trueBranch.descriptor.semantic.type,
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}

export function bindFallbackField(key: string): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unsupported('unsupported_syntax');
    const expression = ResourceFieldExpressionFactory.primitive('string');
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        new PrimitiveType(PrimitiveKind.STRING),
        toCamelCase(key),
        boundAst
    );

    return { descriptor, boundAst };
}
