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
import { resolveModelColumns } from "./columnInferrer";
import { buildModelColumnFacts } from './modelColumnFactsCanonical';
import { correlateModelColumnFacts } from './modelColumnOrigin';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { StringValue, NumberValue } from '../../../../types/upstream/valueObjects';

/**
 * Parses a single Laravel Eloquent model PHP file into a ParsedModel descriptor.
 */
export function parseModelFile(
    source: string,
    modelName: string,
    migrationMap: ReadonlyMap<string, readonly ParsedColumn[]>,
    file: string = modelName
): ParsedModel {
    const tokens = LaravelSourceLexer.tokenize(source);
    const defaultTable = inferLaravelTableName(modelName);
    const members = parseModelMembers(source, tokens, defaultTable);
    const columns = resolveModelColumns(members.table, migrationMap);
    const text = (value: string): StringValue => ({ kind: 'string_value', value });
    const number = (value: number): NumberValue => ({ kind: 'number_value', value });
    const span: SourceSpan = { kind: 'source_span', file: { kind: 'source_file', value: text(file) }, start: number(0), end: number(source.length) };

    return ScannedModelDescriptor.create({
        name: modelName,
        shortName: modelName,
        table: members.table,
        primaryKey: members.primaryKey,
        keyType: members.keyType,
        incrementing: members.incrementing,
        columns,
        columnFacts: buildModelColumnFacts(correlateModelColumnFacts(columns, members.casts, span), span),
        fillable: members.fillable,
        guarded: members.guarded,
        hidden: members.hidden,
        appends: members.appends,
        casts: members.casts,
        accessors: members.accessors,
        relations: members.relations
    });
}
