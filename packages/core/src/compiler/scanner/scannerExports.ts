/**
 * scannerExports.ts
 *
 * Explicit re-exports of AST descriptors and subscanners.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/scannerExports
 */

export {
    LaravelValidationType,
    type LaravelValidationConstraint,
    type ResourceExpressionDescriptor,
    type StaticLaravelScannerOptions,
    ScannedRouteValidationRuleEntry,
    type ScannedRouteValidationRuleParams,
    RouteSemanticFlowValidationRuleSet,
    type RouteValidationRuleSet,
    ValidationTreeBuilder,
    buildValidationTree,
    RouteSemanticFlowFactory,
    RouteParameterSemanticFactory,
    type RouteSemanticFlowCompleteContracts,
    type RouteSemanticFlowConstructorInput,
    type RouteSemanticFlowParams,
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams,
    compileBroadcastRuntimePattern,
    ScannedFormFieldDescriptor,
    type ScannedFormFieldParams,
    ScannedFormActionDescriptor,
    type ScannedFormActionParams,
    ScannedControllerActionDescriptor,
    type ScannedControllerActionParams,
    ScannedRequestTypeDescriptor,
    type ScannedRequestTypeParams,
    type ControllerActionInfo,
    type RequestActionDefinition,
    buildRequestTypeWithActions,
} from "./descriptors";

export { ResourceFieldSemanticBinding, type ResourceFieldSemanticBindingInput } from "../../types/domain/resourceFieldSemanticBinding";

export {
    collectPhpFiles,
    ChannelScanner,
    ControllerScanner,
    ResourceScanner,
    FormRequestScanner,
    ModelScanner,
    RouteScanner,
    InvalidationResolver,
    resolvePrimitiveKind,
    resolveRouteDomain,
    ValidationRuleFieldLowerer,
    RequestTypeDeriver,
    deriveRequestTypes,
    SemanticTypeDeriver,
    TypeDeriver
} from "./subscanners";
