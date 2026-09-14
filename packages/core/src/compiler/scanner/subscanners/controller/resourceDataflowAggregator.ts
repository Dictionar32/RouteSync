/**
 * resourceDataflowAggregator.ts
 *
 * Aggregates candidate resource-to-model bindings from controller actions and resolves conflicts.
 *
 * @module core/compiler/scanner/subscanners/controller/resourceDataflowAggregator
 */

import type { ControllerActionInfo } from "../../descriptors/requestDescriptors";
import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";

/**
 * Aggregates resource model mappings from controller actions with frequency & convention resolution.
 */
export function extractResourceDataflow(
    controllerMap: ReadonlyMap<string, ReadonlyMap<string, ControllerActionInfo>>,
    modelSymbolTable?: ModelSymbolTable
): Map<string, string> {
    const candidates = new Map<string, Map<string, number>>();

    for (const [_, actionMap] of controllerMap) {
        for (const [_, action] of actionMap) {
            if (action.resourceModelMap) {
                for (const [res, model] of action.resourceModelMap) {
                    const modelCounts = candidates.get(res) || new Map<string, number>();
                    modelCounts.set(model, (modelCounts.get(model) || 0) + 1);
                    candidates.set(res, modelCounts);
                }
            }
        }
    }

    const dataflow = new Map<string, string>();
    for (const [res, modelCounts] of candidates) {
        const conventionSym = modelSymbolTable?.findForResource(res);
        if (conventionSym) {
            const convName = conventionSym.name;
            const convShort = conventionSym.shortName;
            if (modelCounts.has(convName)) {
                dataflow.set(res, convName);
                continue;
            }
            if (modelCounts.has(convShort)) {
                dataflow.set(res, convShort);
                continue;
            }
        }

        let bestModel = '';
        let maxCount = -1;
        for (const [model, count] of modelCounts) {
            if (count > maxCount) {
                maxCount = count;
                bestModel = model;
            }
        }
        if (bestModel) {
            dataflow.set(res, bestModel);
        }
    }

    return dataflow;
}
