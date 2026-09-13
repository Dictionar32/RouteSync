/**
 * descriptors/request/index.ts
 *
 * Explicit Sub-Domain Exports for Request Descriptors.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/descriptors/request
 */

export {
    type ControllerActionInfo,
    type ScannedControllerActionParams,
    ScannedControllerActionDescriptor
} from "./controllerActionDescriptor";

export {
    type ScannedFormFieldParams,
    ScannedFormFieldDescriptor
} from "./formFieldDescriptor";

export {
    type ScannedFormActionParams,
    ScannedFormActionDescriptor
} from "./formActionDescriptor";

export {
    type ScannedRequestTypeParams,
    ScannedRequestTypeDescriptor
} from "./requestTypeDescriptor";
