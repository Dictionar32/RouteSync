/**
 * routeContracts.ts
 *
 * Closed Route Sub-Contracts for Complete Constructor Parameterization.
 *
 * @module core/compiler/scanner/descriptors/route/routeContracts
 */

import type { RouteBoundaryContract } from "../../../../types/upstream/route";

export type RouteSemanticFlowCompleteContracts = RouteBoundaryContract;

export type RouteSemanticFlowConstructorInput = RouteSemanticFlowCompleteContracts;

/**
 * Canonical constructor input for a scanned route.
 *
 * Route scanning must consume the high-level semantic route contracts rather
 * than maintaining a second flat vocabulary of route fields.
 */
export type RouteSemanticFlowParams = RouteSemanticFlowCompleteContracts;
