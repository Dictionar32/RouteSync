/**
 * modelAccessorDescriptor.ts
 *
 * AST descriptor for Eloquent Model Accessors.
 *
 * @module core/compiler/scanner/descriptors/model/modelAccessorDescriptor
 */

import { ParsedAccessor } from "../../../../types/route";
import { PrimitiveKind } from "../../../types/SemanticType";
import { toCamelCase } from "../../../../utils/resource-naming";

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
    public readonly name: string;
    public readonly propertyName: string;
    public readonly type: string;
    public readonly nullable: boolean;
    public readonly semanticType: PrimitiveKind;

    constructor({
        name,
        propertyName,
        type,
        nullable,
        semanticType
    }: ScannedModelAccessorParams) {
        this.name = name;
        this.propertyName = propertyName;
        this.type = type;
        this.nullable = nullable;
        this.semanticType = semanticType;
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
