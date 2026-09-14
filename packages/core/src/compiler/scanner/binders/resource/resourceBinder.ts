/**
 * resourceBinder.ts
 *
 * Binds a full Resource definition and its AST array entries to a ModelSymbol.
 *
 * @module core/compiler/scanner/binders/resource/resourceBinder
 */

import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import type { PhpArrayEntry } from "../../lexer/PhpAst";
import type { ResourceFieldDescriptor, ParsedResource } from "../../../../types/route";
import { ScannedResourceDescriptor } from "../../descriptors/resourceDescriptors";
import { ResourceModelResolver } from "../../resolvers/resource/ResourceModelResolver";
import { bindField } from "./fieldBinder";

/**
 * Binds a full Resource definition and its AST array entries to a ModelSymbol.
 */
export function bindResource({
    resourceName,
    entries,
    sourceFile,
    modelSymbolTable,
    controllerDataflowMap,
    relationPropagationMap
}: {
    readonly resourceName: string;
    readonly entries: readonly PhpArrayEntry[];
    readonly sourceFile: string;
    readonly modelSymbolTable: ModelSymbolTable;
    readonly controllerDataflowMap?: ReadonlyMap<string, string>;
    readonly relationPropagationMap?: ReadonlyMap<string, string>;
}): ParsedResource {
    const fieldNames = entries.map(e => e.key);
    const binding = ResourceModelResolver.resolve({
        resourceName,
        fieldNames,
        modelSymbolTable,
        controllerDataflowMap,
        relationPropagationMap
    });

    const modelSymbol = binding.kind === 'mono' ? binding.model : undefined;
    const fields: ResourceFieldDescriptor[] = [];

    for (const entry of entries) {
        const fieldResult = bindField({
            key: entry.key,
            value: entry.value,
            rawExpression: entry.rawExpression,
            modelSymbol,
            modelSymbolTable
        });
        fields.push(fieldResult.descriptor);
    }

    if (binding.kind === 'unbacked_dto') {
        console.warn(
            `[RouteSync Compiler Warning] Resource '${resourceName}' is a DTO without a matching Eloquent model. Non-model DTO resources have limited automatic relation/column derivation support.`
        );
    }

    return ScannedResourceDescriptor.create({
        name: resourceName,
        fields,
        sourceFile,
        modelName: binding.kind === 'mono' ? binding.model.name : null,
        isSynthetic: binding.kind !== 'mono'
    });
}
