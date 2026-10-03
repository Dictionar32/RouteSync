/**
 * Relation-backed semantic type interning.
 *
 * Identity is represented as immutable hash/type facts. The interner is a
 * projection over that relation rather than a host Map-backed cache.
 */

import type { SemanticType } from './SemanticType';
import { TypeHasher, createHashContext } from './TypeHasher';
import {
    relationIndexAdd,
    relationIndexLookup,
    type RelationIndex,
} from '../../semantic/kernel/relationMembership';
import { relationOptionFold } from '../../semantic/kernel/relationalSequence';

export interface TypeInterner {
    readonly intern: (type: SemanticType) => SemanticType;
    readonly getCacheSize: () => number;
    readonly clear: () => void;
}

const createInterner = (): TypeInterner => {
    let cache: RelationIndex<string, SemanticType> = Object.freeze([]);
    return Object.freeze({
        intern: (type: SemanticType): SemanticType => {
            const hash = TypeHasher.hash(type, createHashContext());
            return relationOptionFold(
                relationIndexLookup(cache, hash),
                () => {
                    cache = relationIndexAdd(cache, hash, type);
                    return type;
                },
                value => value,
            );
        },
        getCacheSize: (): number => cache.length,
        clear: (): void => {
            cache = Object.freeze([]);
        },
    });
};

export const TypeInterner = Object.freeze({
    create: createInterner,
});
