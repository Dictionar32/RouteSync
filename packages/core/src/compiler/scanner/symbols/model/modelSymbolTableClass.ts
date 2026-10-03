/** Relation-backed model symbol table. */
import type { ModelAst } from '../../../../types/upstream/ast';
import type { ControllerModelOrigin } from '../../../../types/upstream/controller';
import { createOriginModelSymbol, type OriginModelSymbol } from './originModelSymbol';
import { ResourceNamingConvention } from '../../../../utils/resource-naming';
import type { Lookup, Option } from '../../../../types/upstream/collections';
import type { ModelName, TableName, ResourceName } from '../../../../types/upstream/names';
import { createModelName } from '../../../../types/upstream/names';
import { relationFold, relationOptionFold, relationLookup, relationGate, relationSome, relationNone, relationProject, relationVariant } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationIndexAdd, type RelationIndex } from '../../../../semantic/kernel/relationMembership';

export interface ModelSymbolTable {
    readonly get: (name: ModelName) => Lookup<OriginModelSymbol>;
    readonly findByTableName: (tableName: TableName) => Lookup<OriginModelSymbol>;
    readonly has: (name: ModelName) => boolean;
    readonly all: () => readonly OriginModelSymbol[];
    readonly models: () => readonly ModelAst[];
    readonly findForResource: (resourceName: ResourceName) => Lookup<OriginModelSymbol>;
    readonly findForControllerOrigin: (origin: ControllerModelOrigin) => Lookup<OriginModelSymbol>;
}

export const createModelSymbolTable = (models: readonly ModelAst[] = []): ModelSymbolTable => {
    const state = relationFold(models, {
        list: [] as OriginModelSymbol[],
        byName: [] as RelationIndex<string, Option<OriginModelSymbol>>,
        byShortName: [] as RelationIndex<string, Option<OriginModelSymbol>>,
        byLower: [] as RelationIndex<string, Option<OriginModelSymbol>>,
        byTableName: [] as RelationIndex<string, Option<OriginModelSymbol>>,
    }, (current, model) => {
        const symbol = createOriginModelSymbol(model);
        return {
            list: [...current.list, symbol],
            byName: relationIndexAdd(current.byName, symbol.name.value.value, { kind: 'some', value: symbol }),
            byShortName: relationIndexAdd(current.byShortName, symbol.shortName.value.value, { kind: 'some', value: symbol }),
            byLower: relationIndexAdd(relationIndexAdd(current.byLower, symbol.name.value.value.toLowerCase(), { kind: 'some', value: symbol }), symbol.shortName.value.value.toLowerCase(), { kind: 'some', value: symbol }),
            byTableName: relationIndexAdd(current.byTableName, model.definition.identity.table.value.value.toLowerCase(), { kind: 'some', value: symbol }),
        };
    });
    const get = (name: ModelName): Lookup<OriginModelSymbol> => relationOptionFold(
        relationLookup([...state.byName, ...state.byShortName, ...state.byLower], name.value.value),
        () => ({ kind: 'missing' }),
        value => relationOptionFold(value, () => ({ kind: 'missing' }), symbol => ({ kind: 'found', value: symbol })),
    );
    const findByTableName = (tableName: TableName): Lookup<OriginModelSymbol> => relationOptionFold(
        relationLookup(state.byTableName, tableName.value.value.toLowerCase()),
        () => ({ kind: 'missing' }),
        value => relationOptionFold(value, () => ({ kind: 'missing' }), symbol => ({ kind: 'found', value: symbol })),
    );
    const has = (name: ModelName): boolean => relationEqual(get(name).kind, 'found');
    const all = (): readonly OriginModelSymbol[] => state.list;
    const tableModels = (): readonly ModelAst[] => relationProject(state.list, symbol => symbol.node);
    const findForResource = (resourceName: ResourceName): Lookup<OriginModelSymbol> => {
        const primary = get(createModelName(ResourceNamingConvention.stripSuffix(resourceName.value.value)));
        return relationOptionFold(relationGate(relationEqual(primary.kind, 'found'), () => relationSome(primary.value), () => relationNone()), () => get(createModelName(resourceName.value.value)), value => ({ kind: 'found', value }));
    };
    const findForControllerOrigin = (origin: ControllerModelOrigin): Lookup<OriginModelSymbol> =>
        relationOptionFold(
            relationVariant(origin, 'table'),
            () => relationOptionFold(
                relationVariant(origin, 'model_class'),
                () => ({ kind: 'missing' }),
                value => get(value.name),
            ),
            value => findByTableName(value.name),
        );
    return Object.freeze({ get, findByTableName, has, all, models: tableModels, findForResource, findForControllerOrigin });
};
