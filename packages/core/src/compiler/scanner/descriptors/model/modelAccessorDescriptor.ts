/**
 * modelAccessorDescriptor.ts
 *
 * AST descriptor for Eloquent Model Accessors.
 *
 * @module core/compiler/scanner/descriptors/model/modelAccessorDescriptor
 */

import { ParsedAccessor } from "../../../../types/route";
import { PrimitiveKind, PrimitiveType } from "../../../types/SemanticType";
import { toCamelCase } from "../../../../utils/resource-naming";
import { SemanticValueFactory, type MethodName, type PropertyName } from "../../../../types/domain/semanticValues";
import type { SemanticType } from "../../../types/SemanticType";

export interface ScannedModelAccessorParams {
    readonly name: string;
    readonly propertyName: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly semanticType: PrimitiveKind;
}

/**
 * Reusable Constructor: Scanned Model Accessor Descriptor.
 */
export class ScannedModelAccessorDescriptor implements ParsedAccessor {
    public readonly name: MethodName;
    public readonly propertyName: PropertyName;
    public readonly semanticType: SemanticType;

    constructor({
        name,
        propertyName,
        type,
        nullable,
        semanticType
    }: ScannedModelAccessorParams) {
        this.name = SemanticValueFactory.methodName(name);
        this.propertyName = SemanticValueFactory.propertyName(propertyName);
        this.semanticType = new PrimitiveType(semanticType);
        Object.freeze(this);
    }

    public static fromReturnType({
        name,
        propertyName,
        type,
        nullable = false,
        semanticType
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly type: string;
        readonly nullable?: boolean;
        readonly semanticType?: PrimitiveKind;
    }): ScannedModelAccessorDescriptor {
        let resolvedSemanticType = semanticType;
        if (!resolvedSemanticType) {
            if (type === "number" || type === "int" || type === "float") {
                resolvedSemanticType = PrimitiveKind.NUMBER;
            } else if (type === "boolean" || type === "bool") {
                resolvedSemanticType = PrimitiveKind.BOOLEAN;
            } else {
                resolvedSemanticType = PrimitiveKind.STRING;
            }
        }
        return new ScannedModelAccessorDescriptor({
            name,
            propertyName: propertyName ?? toCamelCase(name),
            type,
            nullable,
            semanticType: resolvedSemanticType
        });
    }

    public static create(params: Parameters<typeof ScannedModelAccessorDescriptor.fromReturnType>[0]): ScannedModelAccessorDescriptor {
        return ScannedModelAccessorDescriptor.fromReturnType(params);
    }
}
