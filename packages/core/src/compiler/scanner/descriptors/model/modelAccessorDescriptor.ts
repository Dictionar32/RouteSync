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
    readonly name: MethodName;
    readonly propertyName: PropertyName;
    readonly computation: ModelAccessorComputation;
}

/**
 * Reusable Constructor: Scanned Model Accessor Descriptor.
 */
export interface ScannedModelAccessorDescriptor extends ParsedAccessor {
    readonly name: MethodName;
    readonly propertyName: PropertyName;
    readonly computation: ModelAccessorComputation;
}

const accessorDescriptor = (params: ScannedModelAccessorParams): ScannedModelAccessorDescriptor => Object.freeze({
    name: params.name,
    propertyName: params.propertyName,
    computation: Object.freeze(params.computation)
});

export const ScannedModelAccessorDescriptor = Object.freeze({
    fromReturnType: ({ name, propertyName, computation }: {
        readonly name: string;
        readonly propertyName: string;
        readonly computation: ModelAccessorComputation;
    }): ScannedModelAccessorDescriptor => accessorDescriptor({
        name: SemanticValueFactory.methodName(name),
        propertyName: SemanticValueFactory.propertyName(propertyName),
        computation
    }),
    create: (params: Parameters<typeof ScannedModelAccessorDescriptor.fromReturnType>[0]): ScannedModelAccessorDescriptor =>
        ScannedModelAccessorDescriptor.fromReturnType(params)
});
