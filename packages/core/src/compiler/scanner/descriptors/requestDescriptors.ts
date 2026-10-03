/**
 * requestDescriptors.ts
 *
 * Active Consumer Orchestrator for Request Descriptors.
 * Coordinates controller action descriptors, form fields, actions, and request types.
 * Conforms to Rule 14: Active Consumer with Pure Flow, zero wildcard re-exports.
 *
 * @module core/compiler/scanner/descriptors/requestDescriptors
 */

import { relationProject } from "../../../semantic/kernel/relationalSequence";
import type { SemanticType } from "../../types/SemanticType";
import type { RequestFieldPresence } from "../../../types/domain/requestFieldPresence";
import type { FormActionName, RequestIdentity, FormRequestSource, RequestResponse } from "../../../types/domain/request";
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
export interface RequestActionDefinition {
    readonly actionName: FormActionName;
    readonly fields: readonly {
        readonly name: string;
        readonly type: SemanticType;
        readonly presence: RequestFieldPresence;
    }[];
}

/**
 * Constructs the canonical request ADT from already-resolved semantic identity
 * and source evidence. No legacy scalar resource projection is accepted.
 */
export function buildRequestTypeWithActions(
    identity: RequestIdentity,
    source: FormRequestSource,
    actionDefinitions: readonly RequestActionDefinition[],
    response: RequestResponse = { kind: 'none' },
): ScannedRequestTypeDescriptor {
    const actions = relationProject(actionDefinitions, def => {
        const fields = relationProject(def.fields, field =>
            ScannedFormFieldDescriptor.fromResolved(field.name, field.type, field.presence),
        );
        return ScannedFormActionDescriptor.create({
            name: def.actionName,
            fields,
        });
    });

    return ScannedRequestTypeDescriptor.create({
        identity,
        source,
        actions,
        response,
    });
}
