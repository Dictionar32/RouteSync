import type { PhpAstValue, PhpClassPropertyAst } from "../../lexer";
import type { ModelKeyKind } from "../../../../types/upstream/model";
import { createColumnName, createPropertyName, createTableName } from "../../../../types/upstream/names";
import type { TableName, ColumnName, PropertyName } from "../../../../types/upstream/names";

type ModelPropertyState = {
    table: TableName;
    primaryKey: ColumnName;
    keyType: { readonly kind: 'not_declared' } | { readonly kind: 'declared'; readonly value: ModelKeyKind };
    incrementing: boolean;
    fillable: PropertyName[];
    guarded: PropertyName[];
    hidden: PropertyName[];
    appends: PropertyName[];
};


const keyTypeValue = (value: string): { readonly kind: 'declared'; readonly value: ModelKeyKind } => {
    const values: ReadonlyMap<string, ModelKeyKind> = new Map([
        ['int', { kind: 'integer' }],
        ['integer', { kind: 'integer' }],
        ['bigint', { kind: 'big_integer' }],
        ['string', { kind: 'string' }],
        ['uuid', { kind: 'uuid' }],
        ['ulid', { kind: 'ulid' }]
    ]);
    const resolved = values.get(value);
    if (resolved === undefined) throw new Error(`Model boundary violation: unsupported Eloquent $keyType "${value}".`);
    return { kind: 'declared', value: resolved };
};

const stringValue = (value: PhpAstValue): string | undefined =>
    value.kind === 'literal' && value.literalType === 'string' ? String(value.value) : undefined;

const propertyArray = (value: PhpAstValue): PropertyName[] => {
    if (value.kind !== 'nested_array') return [];
    return value.entries.flatMap(entry => {
        const item = stringValue(entry.value);
        return item === undefined ? [] : [createPropertyName(item)];
    });
};

export function applyModelPropertyAst(property: PhpClassPropertyAst, state: ModelPropertyState): void {
    const name = property.name;
    const value = property.value;
    if (name === 'table') { const item = stringValue(value); if (item !== undefined) state.table = createTableName(item); return; }
    if (name === 'primaryKey') { const item = stringValue(value); if (item !== undefined) state.primaryKey = createColumnName(item); return; }
    if (name === 'keyType') { const item = stringValue(value); if (item !== undefined) state.keyType = keyTypeValue(item); return; }
    if (name === 'incrementing' && value.kind === 'literal' && value.literalType === 'boolean') { state.incrementing = value.value; return; }
    if (name === 'fillable') { state.fillable = propertyArray(value); return; }
    if (name === 'guarded') { state.guarded = propertyArray(value); return; }
    if (name === 'hidden') { state.hidden = propertyArray(value); return; }
    if (name === 'appends') { state.appends = propertyArray(value); }
}
