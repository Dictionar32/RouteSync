/**
 * modelParser.ts
 *
 * Coordinates tokenization, member parsing, and column inference into a frozen ParsedModel.
 *
 * @module core/compiler/scanner/subscanners/model/modelParser
 */

import type { ParsedModel, ParsedColumn } from "../../../../types/route";
import { inferLaravelTableName } from "../../../../utils/resource-naming";
import { LaravelSourceLexer } from "../../LaravelSourceLexer";
import { ScannedModelDescriptor } from "../../descriptors/modelDescriptors";
import { parseModelMembers } from "./modelMemberParser";
import { inferModelColumns } from "./columnInferrer";

/**
 * Parses a single Laravel Eloquent model PHP file into a ParsedModel descriptor.
 */
export function parseModelFile(
    source: string,
    modelName: string,
    migrationMap?: Map<string, ParsedColumn[]>
): ParsedModel {
    const tokens = LaravelSourceLexer.tokenize(source);
    const defaultTable = inferLaravelTableName(modelName);
    const members = parseModelMembers(source, tokens, defaultTable);
    const columns = inferModelColumns(members.table, members.fillable, members.casts, migrationMap);

    return ScannedModelDescriptor.create({
        name: modelName,
        shortName: modelName,
        table: members.table,
        primaryKey: members.primaryKey,
        keyType: members.keyType,
        incrementing: members.incrementing,
        columns,
        fillable: members.fillable,
        guarded: members.guarded,
        hidden: members.hidden,
        appends: members.appends,
        casts: members.casts,
        accessors: members.accessors,
        relations: members.relations
    });
}
