/**
 * boundaryContractFactory.ts
 *
 * Origin Boundary Factory: resolves perimeter options into the canonical
 * canonical RouteBoundaryContract composite. There is one complete route
 * contract vocabulary; the boundary no longer owns a second flat contract.
 *
 * @module core/compiler/semantic/route-boundary
 */

import type { RouteBoundaryContract, RouteBoundaryOptions } from "./boundaryBasics";
import { routeIdentityContractBuilder } from "./identityBuilder";
import { routeBindingContractBuilder } from "./bindingBuilder";
import { routeCapabilityContractBuilder } from "./capabilityBuilder";
import { routeProvenanceContractBuilder } from "./provenanceBuilder";
import { routeBoundaryInputResolution } from "./boundaryInputResolution";
import { ScannedEndpointContract } from "../../../types/route";
import { relationEqual } from "../../../semantic/relations/semanticRelations";

export class RouteBoundaryContractFactory {
    public static create(options: RouteBoundaryOptions): RouteBoundaryContract {
        const resolved = routeBoundaryInputResolution.resolve(options);
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
        const identity = routeIdentityContractBuilder.build(resolved, basics);
        const binding = routeBindingContractBuilder.build(resolved, basics, resolved.binding);
        const capability = routeCapabilityContractBuilder.build(resolved, basics);
        const provenance = routeProvenanceContractBuilder.build(resolved);
        const contract = ScannedEndpointContract.fromSubcontracts({
            identity,
            binding,
            capability,
            provenance
        });

        return Object.freeze({
            authorization: resolved.authorization,
            identity,
            binding,
            capability,
            provenance,
            contract
        });
    }
}
