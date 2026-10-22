/** Deterministic structural hashing for semantic types. */

import type { SemanticType, SemanticTypeVisitor } from '../../types/domain/semanticType';
import type { TypeHashContext, TypeHasherInterface } from '../../types/upstream/typeHasherInterface';

export type HashContext = TypeHashContext;
export type { TypeHashEntry } from '../../types/upstream/typeHasherInterface';

const sequenceDelimited = (values: readonly string[], separator: string): string => values.join(separator);

const orderedUnique = (values: readonly string[]): readonly string[] => Object.freeze(
    values.reduce<readonly string[]>(
        (unique, value) => unique.some(candidate => Object.is(candidate, value))
            ? unique
            : [...unique, value],
        [],
    ).slice().sort(),
);

const hashSequence = (values: readonly SemanticType[], context: TypeHashContext): readonly string[] =>
    values.map(value => TypeHasher.hash(value, context));

const visitor = (context: TypeHashContext): SemanticTypeVisitor<string> => ({
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
        const parameters = type.parameters.map(parameter => `${parameter.name}[${parameter.variance}]:${TypeHasher.hash(parameter.type, context)}`);
        return `generic:${TypeHasher.hash(type.base, context)}<${sequenceDelimited(parameters, ',')}>`;
    },
    union: type => `union[${sequenceDelimited(orderedUnique(hashSequence(type.members, context)), ',')}]`,
    intersection: type => `intersection[${sequenceDelimited(orderedUnique(hashSequence(type.members, context)), ',')}]`,
    object: type => {
        const properties = type.properties.map(
            property => `${property.name.value.value}:${property.type.isOptional() ? 'opt' : 'req'}:${TypeHasher.hash(property.type, context)}`,
        );
        const name = type.name.length > 0 ? type.name : 'anonymous';
        return `object:${name}{${sequenceDelimited(properties, ',')}}`;
    },
});

export const createHashContext = (): TypeHashContext => ({
    activeStack: Object.freeze([]),
    finalized: Object.freeze([]),
});

export const TypeHasher: TypeHasherInterface = Object.freeze({
    createContext: createHashContext,
    hash: (type: SemanticType, context: TypeHashContext): string => {
        const finalized = context.finalized.find(entry => Object.is(entry[0], type));
        if (finalized !== undefined) {
            return finalized[1];
        }

        const activeIndex = context.activeStack.findIndex(candidate => Object.is(candidate, type));
        if (activeIndex >= 0) {
            return `ref^${context.activeStack.length - activeIndex}`;
        }

        const nestedContext: TypeHashContext = {
            activeStack: Object.freeze([...context.activeStack, type]),
            finalized: context.finalized,
        };
        const baseHash = type.accept(visitor(nestedContext));
        context.finalized = Object.freeze([
            ...context.finalized.filter(entry => !Object.is(entry[0], type)),
            [type, baseHash] as const,
        ]);
        return baseHash;
    },
});
