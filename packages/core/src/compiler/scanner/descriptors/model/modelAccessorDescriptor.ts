/**
 * modelAccessorDescriptor.ts
 *
 * AST descriptor for Eloquent Model Accessors.
 *
 * @module core/compiler/scanner/descriptors/model/modelAccessorDescriptor
 */

import { ParsedAccessor } from "../../../../types/route";
import type { ModelAccessorComputation } from "../../../../types/domain/eloquentTypes";
import { SemanticValueFactory, type MethodName, type PropertyName } from "../../../../types/domain/semanticValues";

export interface ScannedModelAccessorParams {
    readonly name: string;
    readonly propertyName: string;
    readonly computation: ModelAccessorComputation;
}

/**
 * Reusable Constructor: Scanned Model Accessor Descriptor.
 */
export class ScannedModelAccessorDescriptor implements ParsedAccessor {
    public readonly name: MethodName;
    public readonly propertyName: PropertyName;
    public readonly computation: ModelAccessorComputation;

    constructor({ name, propertyName, computation }: ScannedModelAccessorParams) {
        this.name = SemanticValueFactory.methodName(name);
        this.propertyName = SemanticValueFactory.propertyName(propertyName);
        this.computation = Object.freeze(computation);
        Object.freeze(this);
    }

    public static fromReturnType({
        name,
        propertyName,
        computation
    }: {
        readonly name: string;
        readonly propertyName: string;
        readonly computation: ModelAccessorComputation;
    }): ScannedModelAccessorDescriptor {
        return new ScannedModelAccessorDescriptor({
            name,
            propertyName,
            computation
        });
    }

    public static create(params: Parameters<typeof ScannedModelAccessorDescriptor.fromReturnType>[0]): ScannedModelAccessorDescriptor {
        return ScannedModelAccessorDescriptor.fromReturnType(params);
    }
}
