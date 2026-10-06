/**
 * typeExpressionLowerer.ts
 *
 * Lowers SemanticType and ObjectProperty expressions into TypeScript syntax.
 *
 * @module compiler/domain/common/ts-lowerer/builder
 */

import {
    type SemanticType,
    type ObjectProperty
} from '../../../../../types/domain/semanticType';
import {
    TypeScriptPrimitiveMapping
} from '../typeScriptVocabulary';
import { TypeScriptSyntax } from '../typeScriptSyntax';
import { relationProject, relationResolve } from '../../../../../semantic/foundation/relationalSequence';

export function lowerTypeExpression(type: SemanticType): string {
    return type.accept({
        primitive: value => TypeScriptPrimitiveMapping.forPrimitive(value.type),
        jsonValue: () => TypeScriptPrimitiveMapping.UNKNOWN,
        optional: value => TypeScriptSyntax.optional(lowerTypeExpression(value.innerType)),
        nullable: value => TypeScriptSyntax.nullable(lowerTypeExpression(value.innerType)),
        never: () => TypeScriptPrimitiveMapping.UNKNOWN,
        error: () => TypeScriptPrimitiveMapping.UNKNOWN,
        reference: value => value.emittedName,
        union: value => TypeScriptSyntax.union(value.members, lowerTypeExpression),
        intersection: value => TypeScriptSyntax.intersection(value.members, lowerTypeExpression),
        readonlyCollection: value => TypeScriptSyntax.array(lowerTypeExpression(value.elementType)),
        mutableCollection: value => TypeScriptSyntax.array(lowerTypeExpression(value.elementType)),
        generic: value => `${value.base.name}<${relationProject(value.parameters, parameter => lowerTypeExpression(parameter.type)).join(', ')}>`,
        object: value => TypeScriptSyntax.inlineObject(value.properties, property => lowerProperty(property, true))
    });
}

export function lowerProperty(prop: ObjectProperty, includeJsDoc = true): string {
    const propertyCode = `${prop.name.value.value}: ${lowerTypeExpression(prop.type)};`;
    return relationResolve(includeJsDoc, () => `${TypeScriptSyntax.formatJsDoc(prop.description)}${propertyCode}`, () => propertyCode);
}
