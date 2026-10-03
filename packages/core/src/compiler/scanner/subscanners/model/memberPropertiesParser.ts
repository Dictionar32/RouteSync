import type { PhpAstValue, PhpClassPropertyAst } from "../../lexer";
import type { ModelKeyKind } from "../../../../types/upstream/model";
import { createColumnName, createPropertyName, createTableName } from "../../../../types/upstream/names";
import type { TableName, ColumnName, PropertyName } from "../../../../types/upstream/names";
import { relationAll, relationEqual } from "../../../../semantic/kernel/semanticRelations";
import { relationFold, relationFirstOption, relationOptionFold, relationRefine, relationSelect, relationSome, relationNone } from "../../../../semantic/kernel/relationalSequence";

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

type KeyTypeCandidate = { readonly name: string; readonly value: ModelKeyKind };
type PropertyCandidate = { readonly name: string; readonly apply: (state: ModelPropertyState, value: PhpAstValue) => void };

const keyTypeValue = (value: string): { readonly kind: 'declared'; readonly value: ModelKeyKind } => {
    const candidates: readonly KeyTypeCandidate[] = [
        { name: 'int', value: { kind: 'integer' } },
        { name: 'integer', value: { kind: 'integer' } },
        { name: 'bigint', value: { kind: 'big_integer' } },
        { name: 'string', value: { kind: 'string' } },
        { name: 'uuid', value: { kind: 'uuid' } },
        { name: 'ulid', value: { kind: 'ulid' } },
    ];
    return relationOptionFold(
        relationFirstOption(candidates, candidate => relationEqual(candidate.name, value)),
        () => { throw Error(`Model boundary violation: unsupported Eloquent $keyType "${value}".`); },
        candidate => ({ kind: 'declared', value: candidate.value }),
    );
};

const stringValue = (value: PhpAstValue) =>
    relationOptionFold(
        relationFirstOption([value], candidate => relationAll([relationEqual(candidate.kind, 'literal'), relationEqual(candidate.literalType, 'string')])),
        () => relationNone<string>(),
        candidate => relationSome(String(candidate.value)),
    );

const propertyArray = (value: PhpAstValue): PropertyName[] =>
    relationOptionFold(
        relationFirstOption([value], candidate => relationEqual(candidate.kind, 'nested_array')),
        () => [],
        candidate => relationFold(
            candidate.entries,
            [] as PropertyName[],
            (output, entry) => relationOptionFold(
                stringValue(entry.value),
                () => output,
                item => [...output, createPropertyName(item)],
            ),
        ),
    );

const applyStringProperty = (setter: (state: ModelPropertyState, value: string) => void) =>
    (state: ModelPropertyState, value: PhpAstValue): void =>
        relationOptionFold(stringValue(value), () => {}, item => setter(state, item));

const propertyCandidates: readonly PropertyCandidate[] = [
    { name: 'table', apply: applyStringProperty((state, value) => { state.table = createTableName(value); }) },
    { name: 'primaryKey', apply: applyStringProperty((state, value) => { state.primaryKey = createColumnName(value); }) },
    { name: 'keyType', apply: applyStringProperty((state, value) => { state.keyType = keyTypeValue(value); }) },
    {
        name: 'incrementing',
        apply: (state, value) =>
            relationOptionFold(
                relationFirstOption([value], candidate => relationAll([relationEqual(candidate.kind, 'literal'), relationEqual(candidate.literalType, 'boolean')])),
                () => {},
                candidate => { state.incrementing = Boolean(candidate.value); },
            ),
    },
    { name: 'fillable', apply: (state, value) => { state.fillable = propertyArray(value); } },
    { name: 'guarded', apply: (state, value) => { state.guarded = propertyArray(value); } },
    { name: 'hidden', apply: (state, value) => { state.hidden = propertyArray(value); } },
    { name: 'appends', apply: (state, value) => { state.appends = propertyArray(value); } },
];

const applyCandidate = (name: string, value: PhpAstValue, state: ModelPropertyState): void =>
    relationOptionFold(
        relationFirstOption(
            relationSelect(propertyCandidates, candidate => relationEqual(candidate.name, name)),
            candidate => relationEqual(candidate.name, name),
        ),
        () => {},
        candidate => candidate.apply(state, value),
    );

export function applyModelPropertyAst(property: PhpClassPropertyAst, state: ModelPropertyState): void {
    relationOptionFold(
        relationRefine(
            property.initialization,
            (candidate): candidate is Extract<typeof property.initialization, { readonly kind: 'present' }> => relationEqual(candidate.kind, 'present'),
        ),
        () => {},
        candidate => applyCandidate(property.name, candidate.value, state),
    );
}
