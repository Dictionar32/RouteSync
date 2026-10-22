/** Compiler implementation of the upstream semantic type interning contract. */
import type { SemanticType } from '../../types/domain/semanticType';
import type { TypeInternerInterface } from '../../types/upstream/typeInternerInterface';
import { TypeHasher, createHashContext } from './TypeHasher';

export type TypeInterner = TypeInternerInterface;

const createInterner = (): TypeInternerInterface => {
    let cache: readonly { readonly identity: string; readonly type: SemanticType }[] = Object.freeze([]);
    return Object.freeze({
        intern: (type: SemanticType): SemanticType => {
            const identity = TypeHasher.hash(type, createHashContext());
            const existing = cache.find(entry => entry.identity === identity);
            if (existing !== undefined) {
                return existing.type;
            }
            cache = Object.freeze([...cache, Object.freeze({ identity, type })]);
            return type;
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
