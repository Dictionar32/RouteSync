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
    sourceLine,
    modelSymbolTable,
    controllerDataflowMap,
    relationPropagationMap
}: {
    readonly resourceName: string;
    readonly entries: readonly PhpArrayEntry[];
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly modelSymbolTable: ModelSymbolTable;
    readonly controllerDataflowMap?: import("../../subscanners/controller/resourceDataflowAggregator").ControllerResourceDataflow;
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

    if (binding.kind !== 'mono') {
        throw new Error(
            `Resource '${resourceName}' cannot cross the semantic boundary without a resolved Eloquent model.`
        );
    }

    const modelSymbol = binding.model;
    const fields: ResourceFieldDescriptor[] = [];

    for (const entry of entries) {
        const fieldResult = bindField({
            key: requireStringArrayKey(entry.key),
            value: entry.value,
            modelSymbol,
            modelSymbolTable
        });
        fields.push(fieldResult.descriptor);
    }

    return ScannedResourceDescriptor.create({
        name: resourceName,
        fields,
        sourceFile,
        sourceLine,
        assignments: [],
        modelName: binding.model.name,
        isSynthetic: false
    });
}


function requireStringArrayKey(key: import('../../lexer/phpAstTypes').PhpArrayKey): string {
    if (key.kind === 'string') return key.value;
    throw new Error('Expected a static string PHP array key at this semantic boundary');
}
