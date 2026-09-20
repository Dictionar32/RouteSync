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

export interface ResourceRelationEdge {
    readonly parentResource: string;
    readonly childResource: string;
    readonly relationKey: string;
}

/**
 * Resolves initial model for a resource via controller dataflow or naming convention.
 */
export function resolveInitialModel(
    resourceName: string,
    modelSymbolTable: ModelSymbolTable,
    controllerDataflowMap: import("../controller/resourceDataflowAggregator").ControllerResourceDataflow | undefined,
    resolvedModels: Map<string, OriginModelSymbol>
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
            resolvedModels.set(resourceName, sym);
            return;
        }
    }
    const conventionSym = matchLookup(modelSymbolTable.findForResource(resourceName), {
        missing: () => undefined,
        found: ({ value }) => value
    });
    if (conventionSym !== undefined) {
        resolvedModels.set(resourceName, conventionSym);
    }
}

/**
 * Propagates backing models across parent-child resource relations until fixpoint.
 */
export function propagateRelationEdges(
    relationEdges: readonly ResourceRelationEdge[],
    resolvedModels: Map<string, OriginModelSymbol>,
    modelSymbolTable: ModelSymbolTable,
    maxIterations = 5
): Map<string, string> {
    const relationPropagationMap = new Map<string, string>();
    let changed = true;
    let iteration = 0;

    while (changed && iteration < maxIterations) {
        changed = false;
        iteration++;
        for (const edge of relationEdges) {
            if (resolvedModels.has(edge.parentResource) && !resolvedModels.has(edge.childResource)) {
                const parentSym = resolvedModels.get(edge.parentResource)!;
                const rel = matchLookup(parentSym.relation(edge.relationKey), {
                    missing: () => undefined,
                    found: ({ value }) => value
                });
                if (rel) {
                    const childSym = matchLookup(modelSymbolTable.get(rel.targetModel.value.value), {
                        missing: () => undefined,
                        found: ({ value }) => value
                    });
                    if (childSym !== undefined) {
                        resolvedModels.set(edge.childResource, childSym);
                        relationPropagationMap.set(edge.childResource, rel.targetModel.value.value);
                        changed = true;
                    }
                }
            }
        }
    }

    return relationPropagationMap;
}
