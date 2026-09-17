/**
 * ResourceModelResolver.ts
 *
 * Multi-Tiered Semantic AST Dataflow & Structural Type Inference for Laravel Resources.
 * Conforms to Rule 10 (0 '?'), Rule 12 (Invariant-Preserving ADT), and Rule 14 (Active Consumer).
 *
 * @module compiler/scanner/resolvers/resource
 */

import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import {
    type ResourceModelBinding,
    ResourceModelBindingFactory
} from "../../symbols/resource/resourceBindingTypes";
import { matchStructuralFields } from "./structuralFieldMatcher";
import { findControllerResourceBinding } from "../../subscanners/controller/resourceDataflowAggregator";

export interface ResourceModelResolutionInput {
    readonly resourceName: string;
    readonly fieldNames: readonly string[];
    readonly modelSymbolTable: ModelSymbolTable;
    readonly controllerDataflowMap?: import("../../subscanners/controller/resourceDataflowAggregator").ControllerResourceDataflow;
    readonly relationPropagationMap?: ReadonlyMap<string, string>;
}

export class ResourceModelResolver {
    /**
     * Resolves the backing Eloquent Model through the 5-tiered hierarchy.
     */
    public static resolve(input: ResourceModelResolutionInput): ResourceModelBinding {
        const {
            resourceName,
            fieldNames,
            modelSymbolTable,
            controllerDataflowMap,
            relationPropagationMap
        } = input;

        // ─── Tier 1: Controller AST Dataflow ─────────────────────────────────
        const controllerBinding = controllerDataflowMap
            ? findControllerResourceBinding(controllerDataflowMap, resourceName)
            : undefined;
        if (controllerBinding) {
            const sym = controllerBinding.model.kind === 'table'
                ? modelSymbolTable.findByTableName(controllerBinding.model.name)
                : modelSymbolTable.get(controllerBinding.model.name);
            if (sym) return ResourceModelBindingFactory.mono(sym, 'controller_dataflow');
        }

        // ─── Tier 2: Relation Graph Propagation ──────────────────────────────
        if (relationPropagationMap && relationPropagationMap.has(resourceName)) {
            const targetModel = relationPropagationMap.get(resourceName)!;
            const sym = modelSymbolTable.get(targetModel);
            if (sym) {
                return ResourceModelBindingFactory.mono(sym, 'relation_propagation');
            }
        }

        // ─── Tier 3: Model Symbol Table Convention ───────────────────────────
        const conventionSym = modelSymbolTable.findForResource(resourceName);
        if (conventionSym) {
            return ResourceModelBindingFactory.mono(conventionSym, 'convention');
        }

        // ─── Tier 4: Weighted Structural Field Matching ──────────────────────
        if (fieldNames.length > 0) {
            const structuralMatch = matchStructuralFields(fieldNames, modelSymbolTable);
            if (structuralMatch) {
                return ResourceModelBindingFactory.mono(structuralMatch, 'structural');
            }
        }

        // ─── Tier 5: Unbacked DTO Classification ─────────────────────────────
        return ResourceModelBindingFactory.unbackedDto(
            `Resource '${resourceName}' is a DTO without a matching Eloquent model.`
        );
    }
}
