/** Relation-backed model symbol table and semantic model witness. */
import type { ModelNode } from './modelNodes';
import type { ModelColumnFact } from '../types/upstream/modelSourceFacts';
import type { ModelSemanticAccessor, ModelSemanticRelation } from '../types/upstream/model';
import type { Lookup } from '../types/upstream/collections';
import { relationEqual } from './kernel/semanticRelations';
import { relationFirst, relationOptionFold, relationProject, relationSelect } from './kernel/relationalSequence';

const found = <T>(value: T): Lookup<T> => ({ kind: 'found', value });
const missing = <T>(): Lookup<T> => ({ kind: 'missing' });

export interface ModelSymbol {
    readonly node: ModelNode;
    readonly name: string;
    readonly columnFact: (name: string) => Lookup<ModelColumnFact>;
    readonly accessor: (name: string) => Lookup<ModelSemanticAccessor>;
    readonly relation: (name: string) => Lookup<ModelSemanticRelation>;
}

export const createModelSymbol = (node: ModelNode): ModelSymbol => {
    const name = node.definition.semantic.identity.name.value.value;
    const columnFacts = relationProject(node.definition.semantic.columnFacts.items, fact => fact);
    const properties = relationProject(node.definition.semantic.surface.properties, property => property);
    const relations = relationSelect(properties, (property): property is ModelSemanticRelation => relationEqual(property.kind, 'relation'));
    const accessors = relationSelect(properties, (property): property is ModelSemanticAccessor => relationEqual(property.kind, 'accessor'));
    return Object.freeze({
        node,
        name,
        columnFact: (column: string) => relationOptionFold(relationFirst(columnFacts, fact => relationEqual(fact.column.value.value, column)), missing, found),
        accessor: (property: string) => relationOptionFold(relationFirst(accessors, accessorValue => relationEqual(accessorValue.property.value.value, property)), missing, found),
        relation: (relationName: string) => relationOptionFold(relationFirst(relations, relationValue => relationEqual(relationValue.relation.value.value, relationName)), missing, found),
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
        lookup: name => relationOptionFold(relationFirst(symbols, symbol => relationEqual(symbol.name, name)), missing, found),
        lookupCaseInsensitive: name => {
            const normalized = name.toLowerCase();
            return relationOptionFold(relationFirst(symbols, symbol => relationEqual(symbol.name.toLowerCase(), normalized)), missing, found);
        },
        findFirst: predicate => relationOptionFold(relationFirst(symbols, symbol => predicate(symbol.node)), missing, found),
    });
};
