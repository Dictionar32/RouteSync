/**
 * boundary/index.ts
 *
 * Explicit named exports for Route Boundary Adapter sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/semantic/route-boundary
 */

export {
    type RouteBoundaryContract,
    type RouteBoundaryOptions,
    type IntermediateRouteBoundaryBasics,
    type RouteBoundaryBasicsSemanticInput,
    type RouteBoundaryBasicsFact,
    type RouteBoundaryBasicsJudgment,
    resolveRouteBoundaryBasics,
    resolveRouteBoundaryBasicsJudgment,
    routeBoundaryBasicsInterface
} from "./boundaryBasics";

export { RouteBoundaryContractFactory } from "./boundaryContractFactory";
export { routeIdentityContractBuilder, type RouteIdentityContractBuilderInterface } from "./identityBuilder";
export { routeBindingContractBuilder, type RouteBindingContractBuilderInterface } from "./bindingBuilder";
export { routeCapabilityContractBuilder, type RouteCapabilityContractBuilderInterface } from "./capabilityBuilder";
export { routeProvenanceContractBuilder, type RouteProvenanceContractBuilderInterface, type RouteProvenanceInput } from "./provenanceBuilder";

export {
    type ResolvedRouteCapability,
    type RouteCapabilityResolutionInterface,
    routeCapabilityResolution,
} from "./capabilityResolution";


export { routeBoundaryInputResolution, type RouteBoundaryInputResolutionInterface } from "./boundaryInputResolution";
