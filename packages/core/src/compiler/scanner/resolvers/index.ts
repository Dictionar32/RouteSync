/**
 * resolvers/index.ts
 *
 * Explicit Sub-Domain Exports for First-Class Domain Resolvers at Origin Boundary.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/resolvers
 */

export {
    type RouteDomainResolutionContext,
    RouteDomainResolver
} from "./RouteDomainResolver";

export {
    RouteCrudClassifier
} from "./RouteCrudClassifier";

export {
    type RouteSecurityResolution,
    RouteSecurityResolver
} from "./RouteSecurityResolver";

export {
    type RouteBoundaryContract,
    type RouteBoundaryOptions,
    type SparseRouteParams,
    RouteBoundaryContractFactory
} from "./boundary";

export {
    RouteBoundaryAdapter
} from "./RouteBoundaryAdapter";
