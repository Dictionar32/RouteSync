/**
 * descriptors/index.ts
 *
 * Explicit named exports for AST and Domain Descriptors.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/descriptors
 */

export {
    LaravelValidationType,
    type LaravelValidationConstraint,
    type ResourceExpressionDescriptor,
    type StaticLaravelScannerOptions
} from "./types";

export {
    ScannedRouteValidationRuleEntry,
    type ScannedRouteValidationRuleParams,
    RouteSemanticFlowValidationRuleSet,
    type RouteValidationRuleSet,
    ValidationTreeBuilder,
    buildValidationTree
} from "./validationDescriptors";

export {
    RouteSemanticFlowFactory,
    RouteParameterSemanticFactory,
    type RouteSemanticFlowCompleteContracts,
    type RouteSemanticFlowConstructorInput,
    type RouteSemanticFlowParams,
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams,
} from "./routeDescriptors";

export {
    ScannedResourceFieldDescriptor,
    type ScannedResourceFieldParams,
} from "./resourceDescriptors";

export {
    ScannedModelColumnDescriptor,
    ScannedModelCastDescriptor,
    ScannedModelRelationDescriptor,
    ScannedModelAccessorDescriptor,
    type ScannedModelColumnParams,
    type ScannedModelCastParams,
    type ScannedModelRelationParams,
    type ScannedModelAccessorParams,
} from "./modelDescriptors";

export {
    compileBroadcastRuntimePattern
} from "./channelDescriptors";

export {
    ScannedFormFieldDescriptor,
    type ScannedFormFieldParams,
    ScannedFormActionDescriptor,
    type ScannedFormActionParams,
    ScannedControllerActionDescriptor,
    type ScannedControllerActionParams,
    ScannedRequestTypeDescriptor,
    type ScannedRequestTypeParams,
    type ControllerActionInfo,
    buildRequestTypeWithActions
} from "./requestDescriptors";

