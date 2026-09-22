/**
 * twoPassRelationResolver.ts
 *
 * Fixpoint iteration engine for propagating backing Eloquent models across nested Resource relations.
 *
 * @module core/compiler/scanner/subscanners/resource/twoPassRelationResolver
 */

import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import type { OriginModelSymbol } from "../../symbols/model/originModelSymbol";
import { findControllerResourceBinding } from "../controller/resourceDataflowAggregator";
import { matchLookup } from "../../../../types/upstream/collections";
import type { ModelName, ResourceName, RelationName } from "../../../../types/upstream/names";

export interface ResourceRelationEdge {
    readonly parentResource: ResourceName;
    readonly childResource: ResourceName;
    readonly relationKey: RelationName;
}

function sameResourceName(left: ResourceName, right: ResourceName): boolean {
    return left.value.value === right.value.value;
}

function findResolvedModel(
    resolvedModels: ReadonlyMap<ResourceName, OriginModelSymbol>,
    resourceName: ResourceName
): OriginModelSymbol | undefined {
    for (const [key, value] of resolvedModels) {
        if (sameResourceName(key, resourceName)) return value;
    }
    return undefined;
}

function setResolvedModel(
    resolvedModels: Map<ResourceName, OriginModelSymbol>,
    resourceName: ResourceName,
    model: OriginModelSymbol
): void {
    for (const key of resolvedModels.keys()) {
        if (sameResourceName(key, resourceName)) {
            resolvedModels.set(key, model);
            return;
        }
    }
    resolvedModels.set(resourceName, model);
}

/**
 * Resolves initial model for a resource via controller dataflow or naming convention.
 */
export function resolveInitialModel(
    resourceName: ResourceName,
    modelSymbolTable: ModelSymbolTable,
    controllerDataflowMap: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow | undefined,
    resolvedModels: Map<ResourceName, OriginModelSymbol>
): void {
    const binding = controllerDataflowMap
        ? findControllerResourceBinding(controllerDataflowMap, resourceName)
        : undefined;
    if (binding) {
        const lookup = binding.model.kind === 'table'
            ? modelSymbolTable.findByTableName(binding.model.name)
            : modelSymbolTable.get(binding.model.name);
        const sym = matchLookup(lookup, {
            missing: () => undefined,
            found: ({ value }) => value
        });
        if (sym !== undefined) {
            setResolvedModel(resolvedModels, resourceName, sym);
            return;
        }
    }
    const conventionSym = matchLookup(modelSymbolTable.findForResource(resourceName), {
        missing: () => undefined,
        found: ({ value }) => value
    });
    if (conventionSym !== undefined) {
        setResolvedModel(resolvedModels, resourceName, conventionSym);
    }
}

/**
 * Propagates backing models across parent-child resource relations until fixpoint.
 */
export function propagateRelationEdges(
    relationEdges: readonly ResourceRelationEdge[],
    resolvedModels: Map<ResourceName, OriginModelSymbol>,
    modelSymbolTable: ModelSymbolTable,
    maxIterations = 5
): Map<ResourceName, ModelName> {
    const relationPropagationMap = new Map<ResourceName, ModelName>();
    let changed = true;
    let iteration = 0;

    while (changed && iteration < maxIterations) {
        changed = false;
        iteration++;
        for (const edge of relationEdges) {
            const parentSym = findResolvedModel(resolvedModels, edge.parentResource);
            const childAlreadyResolved = findResolvedModel(resolvedModels, edge.childResource) !== undefined;
            if (parentSym !== undefined && !childAlreadyResolved) {
                const rel = matchLookup(parentSym.relation(edge.relationKey), {
                    missing: () => undefined,
                    found: ({ value }) => value
                });
                if (rel) {
                    const childSym = matchLookup(modelSymbolTable.get(rel.targetModel), {
                        missing: () => undefined,
                        found: ({ value }) => value
                    });
                    if (childSym !== undefined) {
                        setResolvedModel(resolvedModels, edge.childResource, childSym);
                        relationPropagationMap.set(edge.childResource, rel.targetModel);
                        changed = true;
                    }
                }
            }
        }
    }

    return relationPropagationMap;
}
