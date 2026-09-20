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
    ScannedRouteValidationRuleSet,
    type RouteValidationRuleSet,
    ScannedRouteSchemaPayload,
    type ScannedRouteSchemaParams,
    ScannedScalarFieldNode,
    type ScannedScalarFieldParams,
    ScannedObjectFieldNode,
    type ScannedObjectFieldParams,
    ScannedArrayFieldNode,
    type ScannedArrayFieldParams,
    ValidationTreeBuilder,
    buildValidationTree
} from "./validationDescriptors";

export {
    ScannedRouteDescriptor,
    ScannedRouteParameterDescriptor,
    ScannedRouteQueryParameterDescriptor,
    ScannedRoutePolicyDescriptor,
    ScannedRateLimitDescriptor,
    ScannedHttpErrorResponseDescriptor,
    type ScannedRouteCompleteContracts,
    type ScannedRouteConstructorInput,
    type ScannedRouteParams,
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams,
    type ScannedRoutePolicyParams,
    type ScannedRateLimitParams,
    type ScannedHttpErrorResponseParams
} from "./routeDescriptors";

export {
    ScannedResourceFieldDescriptor,
    type ScannedResourceFieldParams,
    ScannedResourceDescriptor,
    type ScannedResourceParams
} from "./resourceDescriptors";

export {
    ScannedModelColumnDescriptor,
    ScannedModelCastDescriptor,
    ScannedModelRelationDescriptor,
    ScannedModelAccessorDescriptor,
    ScannedModelDescriptor,
    type ScannedModelColumnParams,
    type ScannedModelCastParams,
    type ScannedModelRelationParams,
    type ScannedModelAccessorParams,
    type ScannedModelParams
} from "./modelDescriptors";

export {
    ScannedBroadcastChannelDescriptor,
    type ScannedBroadcastChannelParams,
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

export {
    ScannedResourceRouteGroupDescriptor,
    type ScannedResourceRouteGroupParams,
    ScannedRouteManifestDescriptor,
    type ScannedRouteManifestParams
} from "./manifestDescriptors";
