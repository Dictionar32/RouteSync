/**
 * typeExpressionLowerer.ts
 *
 * Lowers SemanticType and ObjectProperty expressions into TypeScript syntax.
 *
 * @module compiler/domain/common/ts-lowerer/builder
 */

import {
    SemanticTypeKind,
    type SemanticType,
    type ObjectProperty
} from '../../../../types/SemanticType';
import {
    TypeScriptPrimitiveMapping
} from '../typeScriptVocabulary';
import { TypeScriptSyntax } from '../typeScriptSyntax';

export function lowerTypeExpression(type: SemanticType): string {
    switch (type.kind) {
        case SemanticTypeKind.Primitive:
            return TypeScriptPrimitiveMapping.forPrimitive(type.type);
        case SemanticTypeKind.Optional:
            return TypeScriptSyntax.optional(lowerTypeExpression(type.innerType));
        case SemanticTypeKind.Nullable:
            return TypeScriptSyntax.nullable(lowerTypeExpression(type.innerType));
        case SemanticTypeKind.ReadonlyCollection:
        case SemanticTypeKind.MutableCollection:
            return TypeScriptSyntax.array(lowerTypeExpression(type.elementType));
        case SemanticTypeKind.Reference:
            return (type.name.endsWith('Resource') && !type.name.endsWith('Transformed'))
                ? `${type.name}Transformed`
                : type.name;
        case SemanticTypeKind.Union:
            return TypeScriptSyntax.union(type.members, lowerTypeExpression);
        case SemanticTypeKind.Intersection:
            return TypeScriptSyntax.intersection(type.members, lowerTypeExpression);
        case SemanticTypeKind.Object:
            return TypeScriptSyntax.inlineObject(type.properties, (p) => lowerProperty(p, true));
        default:
            return TypeScriptPrimitiveMapping.UNKNOWN;
    }
}

export function lowerProperty(prop: ObjectProperty, includeJsDoc = true): string {
    const isOptional = prop.type.kind === SemanticTypeKind.Optional || prop.required === false;
    const targetType = lowerTypeExpression(
        prop.type.kind === SemanticTypeKind.Optional ? (prop.type as any).innerType : prop.type
    );
    const propCode = isOptional
        ? TypeScriptSyntax.formatOptionalProperty(prop.name, targetType)
        : TypeScriptSyntax.formatProperty(prop.name, targetType);

    if (includeJsDoc && prop.description) {
        return `${TypeScriptSyntax.formatJsDoc(prop.description)}${propCode}`;
    }
    return propCode;
}
