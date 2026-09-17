/**
 * boundaryContractFactory.ts
 *
 * Origin Boundary Factory: resolves perimeter options into the canonical
 * ScannedRouteCompleteContracts composite. There is one complete route
 * contract vocabulary; the boundary no longer owns a second flat contract.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import {
    type RouteBoundaryContract,
    type RouteBoundaryOptions,
    buildRouteIdentityContract,
    buildRouteBindingContract,
    buildRouteCapabilityContract,
    buildRouteProvenanceContract
} from "./boundaryBasics";
import { resolveRouteBoundaryInput } from "./boundaryInputResolution";
import { resolveRouteCapability } from "./capabilityResolution";
import { resolveRouteBinding } from "./bindingResolution";
import { ScannedEndpointContract } from "../../../../types/route";

export class RouteBoundaryContractFactory {
    public static create(options: RouteBoundaryOptions): RouteBoundaryContract {
        const resolved = resolveRouteBoundaryInput(options);
        const basics = {
            resolvedControllerName: resolved.controllerName,
            resolvedActionName: resolved.actionName,
            resolvedAction: resolved.action,
            isGetMethod: resolved.method === "GET",
            isHeadMethod: resolved.method === "HEAD",
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
        const resolvedBinding = resolveRouteBinding(resolved);
        const binding = buildRouteBindingContract(resolved, basics, resolvedBinding);
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
