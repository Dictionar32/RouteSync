/**
 * Relation-driven structural hashing for semantic types.
 *
 * Hashing is expressed as a visitor relation plus recursive sequence algebra.
 * The implementation deliberately has no host dispatch statement or mutable
 * keyed cache; cycle/finalization facts live in relations.
 */

import type { SemanticType, SemanticTypeVisitor } from './SemanticType';
import {
    relationIndexAdd,
    relationIndexLookup,
    type RelationIndex,
} from '../../semantic/kernel/relationMembership';
import {
    relationAdvanceIndex,
    relationIndexOf,
    relationOptionFold,
    relationProject,
    relationResolve,
} from '../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../semantic/kernel/semanticRelations';

export interface HashContext {
    readonly activeStack: readonly SemanticType[];
    finalized: RelationIndex<SemanticType, string>;
}

const sequenceDelimited = (values: readonly string[], separator: string, index = 0, output = ''): string =>
    relationResolve(
        index < values.length,
        () => sequenceDelimited(
            values,
            separator,
            relationAdvanceIndex(index, 1),
            `${output}${relationResolve(relationEqual(index, 0), () => '', () => separator)}${values[index]}`,
        ),
        () => output,
    );

const orderedInsert = (values: readonly string[], value: string, index = 0): readonly string[] =>
    relationResolve(
        index < values.length,
        () => relationResolve(
            values[index] > value,
            () => Object.freeze([...values.slice(0, index), value, ...values.slice(index)]),
            () => orderedInsert(values, value, relationAdvanceIndex(index, 1)),
        ),
        () => Object.freeze([...values, value]),
    );

const orderedUnique = (values: readonly string[], index = 0, output: readonly string[] = []): readonly string[] =>
    relationResolve(
        index < values.length,
        () => orderedUnique(values, relationAdvanceIndex(index, 1), orderedInsert(output, values[index])),
        () => output,
    );

const hashSequence = (values: readonly SemanticType[], context: HashContext): readonly string[] =>
    relationProject(values, value => TypeHasher.hash(value, context));

const visitor = (context: HashContext): SemanticTypeVisitor<string> => ({
    primitive: type => `primitive:${type.type}`,
    jsonValue: () => 'json_value',
    optional: type => `optional<${TypeHasher.hash(type.innerType, context)}>`,
    nullable: type => `nullable<${TypeHasher.hash(type.innerType, context)}>`,
    never: () => 'never',
    error: type => `error:${type.diagnosticMessage.value}`,
    reference: type => `reference:${type.namespace}\\${type.name}`,
    readonlyCollection: type => `readonly_collection:${type.collectionKind}<${TypeHasher.hash(type.elementType, context)}>`,
    mutableCollection: type => `mutable_collection:${type.collectionKind}<${TypeHasher.hash(type.elementType, context)}>`,
    generic: type => {
        const parameters = relationProject(type.parameters, parameter => `${parameter.name}[${parameter.variance}]:${TypeHasher.hash(parameter.type, context)}`);
        return `generic:${TypeHasher.hash(type.base, context)}<${sequenceDelimited(parameters, ',')}>`;
    },
    union: type => `union[${sequenceDelimited(orderedUnique(hashSequence(type.members, context)) , ',')}]`,
    intersection: type => `intersection[${sequenceDelimited(orderedUnique(hashSequence(type.members, context)), ',')}]`,
    object: type => {
        const properties = relationProject(
            type.properties,
            property => `${property.name.value.value}:${relationResolve(property.type.isOptional(), () => 'opt', () => 'req')}:${TypeHasher.hash(property.type, context)}`,
        );
        const name = relationResolve(type.name.length > 0, () => type.name, () => 'anonymous');
        return `object:${name}{${sequenceDelimited(properties, ',')}}`;
    },
});

export const createHashContext = (): HashContext => ({
    activeStack: Object.freeze([]),
    finalized: Object.freeze([]),
});

export const TypeHasher = Object.freeze({
    createContext: createHashContext,
    hash: (type: SemanticType, context: HashContext): string => {
        const final = relationIndexLookup(context.finalized, type);
        return relationOptionFold(
            final,
            () => {
                const index = relationIndexOf(context.activeStack, candidate => relationEqual(candidate, type));
                return relationResolve(
                    index >= 0,
                    () => `ref^${context.activeStack.length - index}`,
                    () => {
                        const nestedContext: HashContext = {
                            activeStack: Object.freeze([...context.activeStack, type]),
                            finalized: context.finalized,
                        };
                        const baseHash = type.accept(visitor(nestedContext));
                        const finalized = relationIndexAdd(context.finalized, type, baseHash);
                        context.finalized = finalized;
                        return baseHash;
                    },
                );
            },
            value => value,
        );
    },
});
