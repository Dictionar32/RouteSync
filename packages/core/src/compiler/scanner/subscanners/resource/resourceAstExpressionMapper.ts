/**
 * resourceAstExpressionMapper.ts
 *
 * Maps PHP AST expression values to RouteSync ResourceFieldExpression objects.
 * Pure Catamorphic Mapper: 0 'switch', 0 type assertions.
 *
 * @module core/compiler/scanner/subscanners/resource/resourceAstExpressionMapper
 */

import {
    ResourceFieldDescriptor,
    ResourceFieldExpression,
    ResourceFieldExpressionFactory
} from "../../../../types/route";
import { type PhpAstValue, matchPhpAstValue } from "../../LaravelSourceLexer";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { CollectionKind, ErrorType, NullableType, ObjectType, PrimitiveKind, PrimitiveType, ReadonlyCollectionType, ReferenceType, type SemanticType } from "../../../types/SemanticType";
import type { ModelName, ResourceName, PropertyName, MethodName, VariableName } from "../../../../types/domain/semanticValues";

type MappedResourceExpression =
    | { readonly kind: 'semantic'; readonly expression: ResourceFieldExpression; readonly semanticType: SemanticType }
    | { readonly kind: 'syntax_only'; readonly expression: ResourceFieldExpression };

function modelName(value: string): ModelName {
    return { kind: 'model_name', value };
}

function resourceName(value: string): ResourceName {
    return { kind: 'resource_name', value };
}

function propertyName(value: string): PropertyName {
    return { kind: 'property_name', value };
}

function methodName(value: string): MethodName {
    return { kind: 'method_name', value };
}

function variableName(value: string): VariableName {
    return { kind: 'variable_name', value };
}

function mapPropertyAccess(
    receiver: PhpAstValue,
    property: string,
    nullsafe: boolean
): MappedResourceExpression {
    const target = mapAstValueToExpression(receiver);
    const expression = nullsafe
        ? ResourceFieldExpressionFactory.nullsafePropertyAccess(target.expression, propertyName(property))
        : ResourceFieldExpressionFactory.propertyAccess(target.expression, propertyName(property));
    return { kind: 'syntax_only', expression };
}

function mapMethodCall(
    receiver: PhpAstValue,
    method: string,
    args: readonly PhpAstValue[],
    nullsafe: boolean
): MappedResourceExpression {
    const target = mapAstValueToExpression(receiver);
    const arguments_ = args.map(mapAstValueToExpression).map(result => result.expression);
    const expression = nullsafe
        ? ResourceFieldExpressionFactory.nullsafeMethodCall(target.expression, methodName(method), arguments_)
        : ResourceFieldExpressionFactory.methodCall(target.expression, methodName(method), arguments_);
    return { kind: 'syntax_only', expression };
}

/**
 * Maps a PhpAstValue node into a ResourceFieldExpression with its semantic type.
 */
export function mapAstValueToExpression(
    value: PhpAstValue
): MappedResourceExpression {
    return matchPhpAstValue<MappedResourceExpression>(value, {
        resourceCollection: (v) => ({ kind: 'semantic', expression: ResourceFieldExpressionFactory.resource(resourceName(v.resourceName), { kind: 'collection' }), semanticType: new ReadonlyCollectionType(CollectionKind.ARRAY, new ReferenceType('', v.resourceName)) }),
        resourceSingle: (v) => ({ kind: 'semantic', expression: ResourceFieldExpressionFactory.resource(resourceName(v.resourceName), { kind: 'single' }), semanticType: new ReferenceType('', v.resourceName) }),
        nestedArray: (v) => {
            const childFields: ResourceFieldDescriptor[] = v.entries.map(e => {
                const mappedChild = mapAstValueToExpression(e.value);
                const semanticType = mappedChild.kind === 'semantic'
                    ? mappedChild.semanticType
                    : new ErrorType('Nested resource field requires semantic binding at origin');
                return ScannedResourceFieldDescriptor.fromExpression(
                    e.key,
                    mappedChild.expression,
                    semanticType
                );
            });
            return { kind: 'semantic', expression: ResourceFieldExpressionFactory.object(childFields), semanticType: new ObjectType({ name: "InlineObject", baseName: "InlineObject", properties: childFields.map(field => ({ name: field.name, type: field.semanticType, required: true, nullable: field.semanticType.isNullable(), description: "" })), role: "plain" }) };
        },
        methodChain: (v) => mapMethodCall(v.receiver, v.property, v.arguments, v.nullsafe),
        propertyAccess: (v) => mapPropertyAccess(v.receiver, v.property, v.nullsafe),
        literal: (v) => {
            const literal = v.literalType === 'number'
                ? { kind: 'number' as const, value: v.value }
                : v.literalType === 'boolean'
                    ? { kind: 'boolean' as const, value: v.value }
                    : v.literalType === 'null'
                        ? { kind: 'null' as const, value: null }
                        : { kind: 'string' as const, value: v.value };
            const semanticType = v.literalType === 'number'
                ? new PrimitiveType(PrimitiveKind.NUMBER)
                : v.literalType === 'boolean'
                    ? new PrimitiveType(PrimitiveKind.BOOLEAN)
                    : v.literalType === 'string'
                        ? new PrimitiveType(PrimitiveKind.STRING)
                        : new ErrorType('Null literal has no non-null inner semantic type');
            return { kind: 'semantic', expression: ResourceFieldExpressionFactory.literal(literal), semanticType };
        },
        variableReference: (v) => ({
            kind: 'semantic',
            expression: ResourceFieldExpressionFactory.variable(variableName(v.name)),
            semanticType: new ErrorType('Semantic type requires verified origin binding')
        }),
        ternaryExpression: () => ({ kind: 'semantic', expression: ResourceFieldExpressionFactory.unsupported('unsupported_syntax'), semanticType: new ErrorType('Semantic type requires verified origin binding') }),
        staticCall: (v) => ({
            kind: 'semantic',
            expression: ResourceFieldExpressionFactory.staticMethodCall(
                modelName(v.className),
                methodName(v.method),
                v.arguments.map(mapAstValueToExpression).map(result => result.expression)
            ),
            semanticType: new ErrorType('Semantic type requires verified origin binding')
        }),
        classReference: () => ({ kind: 'semantic', expression: ResourceFieldExpressionFactory.unsupported('unsupported_syntax'), semanticType: new ErrorType('Semantic type requires verified origin binding') }),
        closure: () => ({ kind: 'semantic', expression: ResourceFieldExpressionFactory.unsupported('unsupported_syntax'), semanticType: new ErrorType('Semantic type requires verified origin binding') }),
        arrowFunction: () => ({ kind: 'semantic', expression: ResourceFieldExpressionFactory.unsupported('unsupported_syntax'), semanticType: new ErrorType('Semantic type requires verified origin binding') }),
        unsupported: () => ({ kind: 'semantic', expression: ResourceFieldExpressionFactory.unsupported('unsupported_syntax'), semanticType: new ErrorType('Semantic type requires verified origin binding') })
    });
}
