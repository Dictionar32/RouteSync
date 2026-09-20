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
import { matchLookup, type Lookup } from "../../../../types/upstream/collections";
import type { OriginModelSymbol } from "../../symbols/model/originModelSymbol";

export interface ResourceModelResolutionInput {
    readonly resourceName: string;
    readonly fieldNames: readonly string[];
    readonly modelSymbolTable: ModelSymbolTable;
    readonly controllerDataflowMap?: import("../../subscanners/controller/resourceDataflowAggregator").ControllerResourceDataflow;
    readonly relationPropagationMap?: ReadonlyMap<string, string>;
}

export class ResourceModelResolver {
    private static bind(
        lookup: Lookup<OriginModelSymbol>,
        source: Parameters<typeof ResourceModelBindingFactory.mono>[1]
    ): ResourceModelBinding | undefined {
        return matchLookup(lookup, {
            missing: () => undefined,
            found: ({ value }) => ResourceModelBindingFactory.mono(value, source)
        });
    }

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

        const controllerBinding = controllerDataflowMap
            ? findControllerResourceBinding(controllerDataflowMap, resourceName)
            : undefined;
        if (controllerBinding) {
            const lookup = controllerBinding.model.kind === 'table'
                ? modelSymbolTable.findByTableName(controllerBinding.model.name)
                : modelSymbolTable.get(controllerBinding.model.name);
            const binding = this.bind(lookup, 'controller_dataflow');
            if (binding !== undefined) return binding;
        }

        if (relationPropagationMap && relationPropagationMap.has(resourceName)) {
            const targetModel = relationPropagationMap.get(resourceName)!;
            const binding = this.bind(modelSymbolTable.get(targetModel), 'relation_propagation');
            if (binding !== undefined) return binding;
        }

        const conventionBinding = this.bind(
            modelSymbolTable.findForResource(resourceName),
            'convention'
        );
        if (conventionBinding !== undefined) return conventionBinding;

        if (fieldNames.length > 0) {
            const structuralMatch = matchStructuralFields(fieldNames, modelSymbolTable);
            if (structuralMatch !== undefined) {
                return ResourceModelBindingFactory.mono(structuralMatch, 'structural');
            }
        }

        return ResourceModelBindingFactory.unbackedDto(
            `Resource '${resourceName}' is a DTO without a matching Eloquent model.`
        );
    }
}
