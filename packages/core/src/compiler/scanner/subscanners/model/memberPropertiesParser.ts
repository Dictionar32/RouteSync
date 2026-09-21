import type { PhpAstValue, PhpClassPropertyAst } from "../../lexer";
import { ModelKeyTypeMapper, type ModelKeyType } from "../../../../types/domain/eloquentTypes";

export interface ModelPropertiesState {
    table: string;
    primaryKey: string;
    keyType: ModelKeyType;
    incrementing: boolean;
    fillable: string[];
    guarded: string[];
    hidden: string[];
    appends: string[];
}

const stringValue = (value: PhpAstValue): string | undefined =>
    value.kind === 'literal' && value.literalType === 'string' ? String(value.value) : undefined;

const stringArray = (value: PhpAstValue): string[] => {
    if (value.kind !== 'nested_array') return [];
    return value.entries.flatMap(entry => {
        const item = stringValue(entry.value);
        return item === undefined ? [] : [item];
    });
};

export function applyModelPropertyAst(property: PhpClassPropertyAst, state: ModelPropertiesState): void {
    const name = property.name;
    const value = property.value;
    if (name === 'table') { const item = stringValue(value); if (item !== undefined) state.table = item; return; }
    if (name === 'primaryKey') { const item = stringValue(value); if (item !== undefined) state.primaryKey = item; return; }
    if (name === 'keyType') { const item = stringValue(value); if (item !== undefined) state.keyType = ModelKeyTypeMapper.normalize(item); return; }
    if (name === 'incrementing' && value.kind === 'literal' && value.literalType === 'boolean') { state.incrementing = value.value; return; }
    if (name === 'fillable') { state.fillable = stringArray(value); return; }
    if (name === 'guarded') { state.guarded = stringArray(value); return; }
    if (name === 'hidden') { state.hidden = stringArray(value); return; }
    if (name === 'appends') { state.appends = stringArray(value); }
}
