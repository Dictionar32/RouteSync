/**
 * Relation-driven mapper construction from already-resolved field intents.
 */

import type { MapperIR, MapperFieldIR, ParsedResource } from '../../types/ir';
import { resourceBaseName } from '../../utils/resource-naming';
import { createResponseTypeName } from '../../types/ir/nominalVocabulary';
import type { OptimizedResourceFieldIR } from './irTypes';
import { solveSemanticRelations, type SemanticRelation, type SemanticRelationRewrite } from '../../compiler/scanner/lexer/routeAst/semanticRelationSolver';
import type { TypeIR } from '../../types/ir';
import { relationEqual } from '../../semantic/kernel/semanticRelations';
import { relationContains } from '../../semantic/kernel/relationMembership';
import { relationExpand, relationFold, relationOptionFold, relationFirstOption, relationProject, relationResolve, relationSelect, relationSome, relationNone, type RelationOption } from '../../semantic/kernel/relationalSequence';

type TypeDependencyRelation = 'type_node' | 'type_child' | 'type_reference' | 'type_dependency';
type TypeChildExtractor = (type: TypeIR) => readonly TypeIR[];

const TYPE_CHILDREN: Readonly<Record<TypeIR['kind'], TypeChildExtractor>> = Object.freeze({
    primitive: () => [], reference: () => [], json: () => [], never: () => [], error: () => [], literal: () => [],
    array: type => [(type as Extract<TypeIR, { kind: 'array' }>).items],
    collection: type => [(type as Extract<TypeIR, { kind: 'collection' }>).element],
    nullable: type => [(type as Extract<TypeIR, { kind: 'nullable' }>).inner],
    optional: type => [(type as Extract<TypeIR, { kind: 'optional' }>).inner],
    union: type => (type as Extract<TypeIR, { kind: 'union' }>).types,
    intersection: type => (type as Extract<TypeIR, { kind: 'intersection' }>).types,
    inline_object: type => relationProject((type as Extract<TypeIR, { kind: 'inline_object' }>).properties, property => property.type),
    generic: type => {
        const generic = type as Extract<TypeIR, { kind: 'generic' }>;
        return [generic.base, ...relationProject(generic.parameters, parameter => parameter.type)];
    },
});

type TypeReferenceExtractor = (type: TypeIR) => RelationOption<string>;
const TYPE_REFERENCE_TARGET: Readonly<Record<TypeIR['kind'], TypeReferenceExtractor>> = Object.freeze({
    primitive: () => relationNone(), reference: type => relationSome(String((type as Extract<TypeIR, { kind: 'reference' }>).target)), json: () => relationNone(),
    never: () => relationNone(), error: () => relationNone(), literal: () => relationNone(), array: () => relationNone(), collection: () => relationNone(),
    nullable: () => relationNone(), optional: () => relationNone(), union: () => relationNone(), intersection: () => relationNone(), inline_object: () => relationNone(), generic: () => relationNone(),
});

const typeNodeId = (path: string): string => `type:${path}`;

type TypeWork = readonly [TypeIR, string];

const collectTypeDependencyFacts = (root: TypeIR): readonly SemanticRelation<TypeDependencyRelation>[] => {
    const initial: readonly TypeWork[] = [[root, '0']];
    const work = relationFold(
        initial,
        [] as readonly TypeWork[],
        (accumulator, entry) => [...accumulator, entry],
    );
    const visit = (entries: readonly TypeWork[]): readonly SemanticRelation<TypeDependencyRelation>[] =>
        relationFold(
            entries,
            [],
            (facts, [type, path]) => {
                const id = typeNodeId(path);
                const nodeFact = { relation: 'type_node' as const, arguments: [id, type.kind] };
                const target = TYPE_REFERENCE_TARGET[type.kind](type);
                const referenceFacts = relationOptionFold(
                    target,
                    () => [] as readonly SemanticRelation<TypeDependencyRelation>[],
                    value => [{ relation: 'type_reference' as const, arguments: [id, value] }],
                );
                const children = TYPE_CHILDREN[type.kind](type);
                const childFacts = relationProject(children, (child, index) => ({
                    relation: 'type_child' as const,
                    arguments: [id, typeNodeId(`${path}.${index}`)],
                    child: [child, `${path}.${index}`] as TypeWork,
                }));
                return [
                    ...facts,
                    nodeFact,
                    ...referenceFacts,
                    ...relationProject(childFacts, child => ({ relation: child.relation, arguments: child.arguments })),
                    ...visit(relationProject(childFacts, child => child.child)),
                ];
            },
        );
    return Object.freeze(visit(work));
};

const TYPE_DEPENDENCY_RULES: readonly SemanticRelationRewrite<TypeDependencyRelation>[] = Object.freeze([
    { id: 'reference-dependency', priority: 2, when: [
        { relation: 'type_reference', arguments: [{ variable: 'node' }, { variable: 'target' }] },
    ], then: [{ relation: 'type_dependency', arguments: [{ variable: 'node' }, { variable: 'target' }] }] },
    { id: 'child-dependency-propagation', priority: 1, when: [
        { relation: 'type_child', arguments: [{ variable: 'parent' }, { variable: 'child' }] },
        { relation: 'type_dependency', arguments: [{ variable: 'child' }, { variable: 'target' }] },
    ], then: [{ relation: 'type_dependency', arguments: [{ variable: 'parent' }, { variable: 'target' }] }] },
]);

export type ResourceMapperBuilder = Readonly<{
    readonly buildResourceMapper: (resource: ParsedResource, fields: readonly OptimizedResourceFieldIR[]) => MapperIR;
    readonly extractDependencies: (fields: readonly OptimizedResourceFieldIR[]) => readonly string[];
}>;

const buildResourceMapper = (resource: ParsedResource, fields: readonly OptimizedResourceFieldIR[]): MapperIR => ({
    source: resource.sourceModel,
    target: createResponseTypeName(`${resourceBaseName(resource.name.value.value)}Transformed`),
    mappings: relationProject(fields, field => ({
        source: field.name,
        target: field.transformedName,
        transform: field.transform,
    } satisfies MapperFieldIR)),
});

const extractDependencies = (fields: readonly OptimizedResourceFieldIR[]): readonly string[] => {
    const facts = relationExpand(fields, field => collectTypeDependencyFacts(field.type));
    const solved = solveSemanticRelations<TypeDependencyRelation>(facts, TYPE_DEPENDENCY_RULES);
    const dependencyFacts = relationSelect(solved, () => true);
    return Object.freeze(relationFold(
        dependencyFacts,
        [] as readonly string[],
        (dependencies, fact) => relationResolve(
            relationEqual(fact.relation, 'type_dependency'),
            () => relationOptionFold(
                relationFirstOption([fact.arguments[1]], value => relationEqual(typeof value, 'string')),
                () => dependencies,
                value => relationResolve(relationContains(dependencies, String(value)), () => dependencies, () => [...dependencies, String(value)]),
            ),
            () => dependencies,
        ),
    ));
};

export const createResourceMapperBuilder = (): ResourceMapperBuilder => Object.freeze({
    buildResourceMapper,
    extractDependencies,
});
