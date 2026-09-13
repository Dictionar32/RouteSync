/**
 * Model Member Properties Parser.
 * Scans Eloquent model properties: table, primaryKey, keyType, incrementing, fillable, guarded, hidden, appends.
 *
 * @module core/compiler/scanner/subscanners/model
 */

import { LaravelSourceLexer, type TokenDescriptor } from "../../LaravelSourceLexer";

export interface ModelPropertiesState {
    table: string;
    primaryKey: string;
    keyType: string;
    incrementing: boolean;
    fillable: string[];
    guarded: string[];
    hidden: string[];
    appends: string[];
}

export function tryParseModelProperty(
    source: string,
    tokens: readonly TokenDescriptor[],
    i: number,
    state: ModelPropertiesState
): void {
    const token = tokens[i];

    // $table = 'custom_table';
    if (token.value === '$table' && tokens[i + 1]?.value === '=' && tokens[i + 2]?.type === 'STRING') {
        state.table = tokens[i + 2].value;
    }

    // $primaryKey = 'custom_id';
    if (token.value === '$primaryKey' && tokens[i + 1]?.value === '=' && tokens[i + 2]?.type === 'STRING') {
        state.primaryKey = tokens[i + 2].value;
    }

    // $keyType = 'string';
    if (token.value === '$keyType' && tokens[i + 1]?.value === '=' && tokens[i + 2]?.type === 'STRING') {
        state.keyType = tokens[i + 2].value;
    }

    // $incrementing = false;
    if (token.value === '$incrementing' && tokens[i + 1]?.value === '=') {
        state.incrementing = tokens[i + 2]?.type === 'TRUE';
    }

    // $fillable = [ ... ];
    if (token.value === '$fillable' && tokens[i + 1]?.value === '=') {
        const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
        state.fillable = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
    }

    // $guarded = [ ... ];
    if (token.value === '$guarded' && tokens[i + 1]?.value === '=') {
        const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
        state.guarded = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
    }

    // $hidden = [ ... ];
    if (token.value === '$hidden' && tokens[i + 1]?.value === '=') {
        const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
        state.hidden = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
    }

    // $appends = [ ... ];
    if (token.value === '$appends' && tokens[i + 1]?.value === '=') {
        const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
        state.appends = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
    }
}
