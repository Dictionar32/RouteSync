/**
 * boundaryContractFactory.ts
 *
 * Origin Boundary Factory: resolves perimeter options into the canonical
 * RouteSemanticFlowCompleteContracts composite. There is one complete route
 * contract vocabulary; the boundary no longer owns a second flat contract.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import type { RouteBoundaryContract, RouteBoundaryOptions } from "./boundaryBasics";
import { buildRouteIdentityContract } from "./identityBuilder";
import { buildRouteBindingContract } from "./bindingBuilder";
import { buildRouteCapabilityContract } from "./capabilityBuilder";
import { buildRouteProvenanceContract } from "./provenanceBuilder";
import { resolveRouteBoundaryInput } from "./boundaryInputResolution";
import { resolveRouteCapability } from "./capabilityResolution";
import { ScannedEndpointContract } from "../../../../types/route";
import { relationEqual } from "../../../../semantic/kernel/semanticRelations";

export class RouteBoundaryContractFactory {
    public static create(options: RouteBoundaryOptions): RouteBoundaryContract {
        const resolved = resolveRouteBoundaryInput(options);
        const basics = {
            resolvedControllerName: resolved.controllerName,
            resolvedActionName: resolved.actionName,
            resolvedAction: resolved.action,
            isGetMethod: relationEqual(resolved.method, "GET"),
            isHeadMethod: relationEqual(resolved.method, "HEAD"),
            resolvedActionKind: resolved.actionKind,
            resolvedIsMutating: resolved.isMutating,
            resolvedDomain: resolved.domain,
            resolvedResourceName: resolved.resourceName,
            resolvedParameters: resolved.parameters,
            resolvedPathParameters: resolved.pathParameters,
            resolvedQueryParameters: resolved.queryParameters,
            resolvedGroupName: resolved.groupName,
            resolvedRuntimePath: resolved.runtimePath,
            resolvedConstantKey: resolved.constantKey,
            resolvedRouteName: resolved.name
        };
        const identity = buildRouteIdentityContract(resolved, basics);
        const binding = buildRouteBindingContract(resolved, basics, resolved.binding);
        const resolvedCapability = resolveRouteCapability(resolved, basics, identity.parameters.all.length);
        const capability = buildRouteCapabilityContract(resolved, basics, resolvedCapability);
        const provenance = buildRouteProvenanceContract(resolved);
        const contract = ScannedEndpointContract.fromSubcontracts({
            identity,
            binding,
            capability,
            provenance
        });

        return Object.freeze({
            identity,
            binding,
            capability,
            provenance,
            contract
        });
    }
}
