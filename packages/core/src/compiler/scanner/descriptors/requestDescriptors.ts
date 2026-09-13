/**
 * requestDescriptors.ts
 *
 * Active Consumer Orchestrator for Request Descriptors.
 * Coordinates controller action descriptors, form fields, actions, and request types.
 * Conforms to Rule 14: Active Consumer with Pure Flow, zero wildcard re-exports.
 *
 * @module core/compiler/scanner/descriptors/requestDescriptors
 */

import type { SemanticType } from "../../types/SemanticType";
import {
    type ControllerActionInfo,
    type ScannedControllerActionParams,
    ScannedControllerActionDescriptor,
    type ScannedFormFieldParams,
    ScannedFormFieldDescriptor,
    type ScannedFormActionParams,
    ScannedFormActionDescriptor,
    type ScannedRequestTypeParams,
    ScannedRequestTypeDescriptor
} from "./request";

export {
    type ControllerActionInfo,
    type ScannedControllerActionParams,
    ScannedControllerActionDescriptor,
    type ScannedFormFieldParams,
    ScannedFormFieldDescriptor,
    type ScannedFormActionParams,
    ScannedFormActionDescriptor,
    type ScannedRequestTypeParams,
    ScannedRequestTypeDescriptor
};

/**
 * Active Consumer: Coordinates the assembly of a complete ScannedRequestTypeDescriptor
 * by actively instantiating form fields and actions from raw inputs.
 */
export function buildRequestTypeWithActions(
    resourceName: string,
    actionDefinitions: readonly {
        readonly actionName: string;
        readonly fields: readonly {
            readonly name: string;
            readonly type: SemanticType;
            readonly required?: boolean;
            readonly nullable?: boolean;
        }[];
    }[]
): ScannedRequestTypeDescriptor {
    const actions = actionDefinitions.map(def => {
        const fields = def.fields.map(f =>
            f.required
                ? ScannedFormFieldDescriptor.required(f.name, f.type)
                : ScannedFormFieldDescriptor.optional(f.name, f.type)
        );
        return ScannedFormActionDescriptor.create({
            name: def.actionName,
            fields
        });
    });

    return ScannedRequestTypeDescriptor.create({
        resourceName,
        actions
    });
}
