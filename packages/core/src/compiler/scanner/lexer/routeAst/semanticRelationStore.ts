import { relationEqual, relationResolve } from '../../../relational/sequence';
import { relationFirstOption, relationOptionFold } from '../../../../semantic/kernel/relationalSequence';
import { relationContains, relationInsert, type RelationMembership } from '../../../../semantic/kernel/relationMembership';
import { retain, visit } from './semanticRelationalCollections';
/**
 * Indexed semantic relation store.
 *
 * Buckets and tuple keys are themselves relation data. The store deliberately
 * avoids host Set/Map state in the semantic frontier.
 */
import { relationTupleKey, type RelationAtom } from './semanticRelationalAlgebra';
export interface SemanticStoredRelation<R extends string = string> {
    readonly relation: R;
    readonly arguments: readonly RelationAtom[];
}
type Bucket<R extends string> = readonly SemanticStoredRelation<R>[];
type BucketEntry<R extends string> = readonly [string, Bucket<R>];

const bucketKey = <R extends string>(fact: SemanticStoredRelation<R>): string => `${fact.relation}/${fact.arguments.length}`;
const bucketLookup = <R extends string>(buckets: readonly BucketEntry<R>[], key: string): Bucket<R> =>
    relationOptionFold(
        relationFirstOption(buckets, entry => relationEqual(entry[0], key)),
        () => [],
        entry => entry[1],
    );
const bucketPut = <R extends string>(buckets: readonly BucketEntry<R>[], key: string, fact: SemanticStoredRelation<R>): readonly BucketEntry<R>[] => {
    const existing = bucketLookup(buckets, key);
    const next = Object.freeze([...existing, fact]);
    const retained = retain(buckets, entry => relationEqual(relationEqual(entry[0], key), false));
    return Object.freeze([...retained, [key, next] as const]);
};

export interface SemanticRelationStore<R extends string = string> {
    readonly add: (fact: SemanticStoredRelation<R>) => void;
    readonly bucket: (relation: R, arity: number) => readonly SemanticStoredRelation<R>[];
    readonly contains: (fact: SemanticStoredRelation<R>) => boolean;
}

export const SemanticRelationStore = {
    from<R extends string>(facts: readonly SemanticStoredRelation<R>[]): SemanticRelationStore<R> {
        let buckets: readonly BucketEntry<R>[] = [];
        let keys: RelationMembership<string> = [];
        const add = (fact: SemanticStoredRelation<R>): void => {
            const key = relationTupleKey([fact.relation, ...fact.arguments]);
            buckets = bucketPut(buckets, bucketKey(fact), fact);
            keys = relationInsert(keys, key);
        };
        visit(facts, add);
        return Object.freeze({
            add,
            bucket: (relation: R, arity: number): readonly SemanticStoredRelation<R>[] => bucketLookup(buckets, `${relation}/${arity}`),
            contains: (fact: SemanticStoredRelation<R>): boolean => relationContains(keys, relationTupleKey([fact.relation, ...fact.arguments])),
        });
    },
};
