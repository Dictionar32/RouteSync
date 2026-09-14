/**
 * twoPassRelationResolver.ts
 *
 * Fixpoint iteration engine for propagating backing Eloquent models across nested Resource relations.
 *
 * @module core/compiler/scanner/subscanners/resource/twoPassRelationResolver
 */

import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import type { OriginModelSymbol } from "../../symbols/model/originModelSymbol";

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
    controllerDataflowMap: ReadonlyMap<string, string> | undefined,
    resolvedModels: Map<string, OriginModelSymbol>
): void {
    if (controllerDataflowMap && controllerDataflowMap.has(resourceName)) {
        const target = controllerDataflowMap.get(resourceName)!;
        const sym = target.startsWith('table:')
            ? modelSymbolTable.findByTableName(target.slice(6))
            : modelSymbolTable.get(target);
        if (sym) {
            resolvedModels.set(resourceName, sym);
            return;
        }
    }
    const conventionSym = modelSymbolTable.findForResource(resourceName);
    if (conventionSym) {
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
                const rel = parentSym.relation(edge.relationKey);
                if (rel && rel.targetModel) {
                    const childSym = modelSymbolTable.get(rel.targetModel);
                    if (childSym) {
                        resolvedModels.set(edge.childResource, childSym);
                        relationPropagationMap.set(edge.childResource, rel.targetModel);
                        changed = true;
                    }
                }
            }
        }
    }

    return relationPropagationMap;
}
