/**
 * boundary/index.ts
 *
 * Explicit named exports for Route Boundary Adapter sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

export {
    type SparseRouteParams,
    type IntermediateRouteBoundaryBasics,
    resolveRouteBoundaryBasics
} from "./boundaryBasics";

export { buildRouteIdentityContract } from "./identityBuilder";
export { buildRouteBindingContract } from "./bindingBuilder";
export { buildRouteCapabilityContract } from "./capabilityBuilder";
export { buildRouteProvenanceContract } from "./provenanceBuilder";
