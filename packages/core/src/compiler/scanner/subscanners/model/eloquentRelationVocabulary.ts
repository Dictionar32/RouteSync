import type { EloquentRelationDescriptor, EloquentRelationType } from '../../../../types/upstream/modelVocabulary';
import type { StringValue } from '../../../../types/upstream/valueObjects';

export type EloquentRelationMethodName = {
    readonly kind: 'eloquent_relation_method_name';
    readonly value: StringValue;
};

const descriptorTable: ReadonlyMap<string, EloquentRelationDescriptor> = new Map([
    ['hasOne', { type: { kind: 'has_one' }, relation: { kind: 'has_one' }, cardinality: { kind: 'one' }, multiplicity: { kind: 'single' }, polymorphism: { kind: 'non_polymorphic' } }],
    ['hasMany', { type: { kind: 'has_many' }, relation: { kind: 'has_many' }, cardinality: { kind: 'many' }, multiplicity: { kind: 'collection' }, polymorphism: { kind: 'non_polymorphic' } }],
    ['belongsTo', { type: { kind: 'belongs_to' }, relation: { kind: 'belongs_to' }, cardinality: { kind: 'one' }, multiplicity: { kind: 'single' }, polymorphism: { kind: 'non_polymorphic' } }],
    ['belongsToMany', { type: { kind: 'belongs_to_many' }, relation: { kind: 'belongs_to_many' }, cardinality: { kind: 'many' }, multiplicity: { kind: 'collection' }, polymorphism: { kind: 'non_polymorphic' } }],
    ['hasOneThrough', { type: { kind: 'has_one_through' }, relation: { kind: 'has_one_through' }, cardinality: { kind: 'one' }, multiplicity: { kind: 'single' }, polymorphism: { kind: 'non_polymorphic' } }],
    ['hasManyThrough', { type: { kind: 'has_many_through' }, relation: { kind: 'has_many_through' }, cardinality: { kind: 'many' }, multiplicity: { kind: 'collection' }, polymorphism: { kind: 'non_polymorphic' } }],
    ['morphTo', { type: { kind: 'morph_to' }, relation: { kind: 'morph_to' }, cardinality: { kind: 'one' }, multiplicity: { kind: 'single' }, polymorphism: { kind: 'polymorphic' } }],
    ['morphOne', { type: { kind: 'morph_one' }, relation: { kind: 'morph_one' }, cardinality: { kind: 'one' }, multiplicity: { kind: 'single' }, polymorphism: { kind: 'polymorphic' } }],
    ['morphMany', { type: { kind: 'morph_many' }, relation: { kind: 'morph_many' }, cardinality: { kind: 'many' }, multiplicity: { kind: 'collection' }, polymorphism: { kind: 'polymorphic' } }],
    ['morphToMany', { type: { kind: 'morph_to_many' }, relation: { kind: 'morph_to_many' }, cardinality: { kind: 'many' }, multiplicity: { kind: 'collection' }, polymorphism: { kind: 'polymorphic' } }],
    ['morphedByMany', { type: { kind: 'morphed_by_many' }, relation: { kind: 'morphed_by_many' }, cardinality: { kind: 'many' }, multiplicity: { kind: 'collection' }, polymorphism: { kind: 'polymorphic' } }],
]);

const methodValue = (name: EloquentRelationMethodName): string => name.value.value;

export const eloquentRelationClassifier = Object.freeze({
    isRelationMethod(name: EloquentRelationMethodName): boolean {
        return descriptorTable.has(methodValue(name));
    },
    descriptor(name: EloquentRelationMethodName): EloquentRelationDescriptor {
        const descriptor = descriptorTable.get(methodValue(name));
        if (descriptor === undefined) throw new Error(`Unsupported Eloquent relation method: ${methodValue(name)}`);
        return descriptor;
    },
    type(name: EloquentRelationMethodName): EloquentRelationType {
        return eloquentRelationClassifier.descriptor(name).type;
    },
});
