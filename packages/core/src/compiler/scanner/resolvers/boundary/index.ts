/**
 * boundary/index.ts
 *
 * Explicit named exports for Route Boundary Adapter sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/resolvers/boundary
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
export { buildRouteIdentityContract } from "./identityBuilder";
export { buildRouteBindingContract } from "./bindingBuilder";
export { buildRouteCapabilityContract } from "./capabilityBuilder";
export { buildRouteProvenanceContract } from "./provenanceBuilder";

export {
    type RouteCapabilitySemanticInput,
    type ResolvedRouteCapability,
    resolveRouteCapabilityJudgment,
    resolveRouteCapability,
} from "./capabilityResolution";

export { resolveRouteBinding } from "./bindingResolution";

export { resolveRouteBoundaryInput } from "./boundaryInputResolution";
