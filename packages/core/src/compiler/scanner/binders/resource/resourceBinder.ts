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
import { bindField } from "./fieldBinder";

/**
 * Binds a full Resource definition and its AST array entries to a ModelSymbol.
 */
export function bindResource({
    resourceName,
    entries,
    sourceFile,
    modelSymbolTable
}: {
    readonly resourceName: string;
    readonly entries: readonly PhpArrayEntry[];
    readonly sourceFile: string;
    readonly modelSymbolTable: ModelSymbolTable;
}): ParsedResource {
    const modelSymbol = modelSymbolTable.findForResource(resourceName);
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

    return ScannedResourceDescriptor.create({
        name: resourceName,
        fields,
        sourceFile
    });
}
