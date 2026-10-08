/** Relation-backed model symbol table and semantic model witness. */
import type { ModelNode } from './modelNodes';
import type { ModelColumnFact } from '../types/upstream/modelSourceFacts';
import type { ModelSemanticAccessor, ModelSemanticColumn, ModelSemanticRelation } from '../types/upstream/model';
import type { Lookup } from '../types/upstream/collections';
import { relationEqual } from './kernel/semanticRelations';
import { relationFirst, relationOptionFold, relationProject, relationSelect, relationSequenceToArray } from './kernel/relationalSequence';

const found = <T>(value: T): Lookup<T> => ({ kind: 'found', value });
const missing = <T>(): Lookup<T> => ({ kind: 'missing' });

const sequenceToRelation = <T>(sequence: import('../types/upstream/collections').Sequence<T>): readonly T[] =>
    relationSequenceToArray(sequence);

export interface ModelSymbol {
    readonly node: ModelNode;
    readonly name: string;
    readonly columnFact: (name: string) => Lookup<ModelColumnFact>;
    readonly column: (name: string) => Lookup<ModelSemanticColumn>;
    readonly accessor: (name: string) => Lookup<ModelSemanticAccessor>;
    readonly relation: (name: string) => Lookup<ModelSemanticRelation>;
}

export const createModelSymbol = (node: ModelNode): ModelSymbol => {
    const name = node.definition.semantic.identity.name.value.value;
    const columnFacts: readonly ModelColumnFact[] = sequenceToRelation(node.definition.semantic.columnFacts.items);
    const properties: readonly import('../types/upstream/model').ModelSemanticProperty[] = sequenceToRelation(node.definition.semantic.surface.properties);
    const relations = relationSelect(properties, (property): property is ModelSemanticRelation => relationEqual(property.kind, 'relation'));
    const accessors = relationSelect(properties, (property): property is ModelSemanticAccessor => relationEqual(property.kind, 'accessor'));
    return Object.freeze({
        node,
        name,
        columnFact: (column: string): Lookup<ModelColumnFact> => relationOptionFold(relationFirst<ModelColumnFact>(columnFacts, fact => relationEqual(fact.column.value.value, column)), missing<ModelColumnFact>, found<ModelColumnFact>),
        column: (property: string): Lookup<ModelSemanticColumn> => relationOptionFold(relationFirst<ModelSemanticColumn>(relationSelect(properties, (value): value is ModelSemanticColumn => relationEqual(value.kind, 'column')), columnValue => relationEqual(columnValue.property.value.value, property)), missing<ModelSemanticColumn>, found<ModelSemanticColumn>),
        accessor: (property: string): Lookup<ModelSemanticAccessor> => relationOptionFold(relationFirst<ModelSemanticAccessor>(accessors, accessorValue => relationEqual(accessorValue.property.value.value, property)), missing<ModelSemanticAccessor>, found<ModelSemanticAccessor>),
        relation: (relationName: string): Lookup<ModelSemanticRelation> => relationOptionFold(relationFirst<ModelSemanticRelation>(relations, relationValue => relationEqual(relationValue.relation.value.value, relationName)), missing<ModelSemanticRelation>, found<ModelSemanticRelation>),
    });
};

export interface SymbolTable {
    readonly lookup: (name: string) => Lookup<ModelSymbol>;
    readonly lookupCaseInsensitive: (name: string) => Lookup<ModelSymbol>;
    readonly findFirst: (predicate: (node: ModelNode) => boolean) => Lookup<ModelSymbol>;
}

export const createSymbolTable = (models: readonly ModelNode[]): SymbolTable => {
    const symbols = Object.freeze(relationProject(models, createModelSymbol));
    return Object.freeze({
        lookup: (name: string): Lookup<ModelSymbol> => relationOptionFold(relationFirst<ModelSymbol>(symbols, symbol => relationEqual(symbol.name, name)), missing<ModelSymbol>, found<ModelSymbol>),
        lookupCaseInsensitive: (name: string): Lookup<ModelSymbol> => {
            const normalized = name.toLowerCase();
            return relationOptionFold(relationFirst<ModelSymbol>(symbols, symbol => relationEqual(symbol.name.toLowerCase(), normalized)), missing<ModelSymbol>, found<ModelSymbol>);
        },
        findFirst: (predicate: (node: ModelNode) => boolean): Lookup<ModelSymbol> => relationOptionFold(relationFirst<ModelSymbol>(symbols, symbol => predicate(symbol.node)), missing<ModelSymbol>, found<ModelSymbol>),
    });
};

