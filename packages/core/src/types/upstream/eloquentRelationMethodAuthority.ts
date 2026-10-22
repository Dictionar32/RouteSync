import type { EloquentRelationDescriptor } from './modelVocabulary';
import type { EloquentRelationMethodAuthorityInterface, EloquentRelationMethodJudgment, EloquentRelationMethodName } from './eloquentRelationMethodAuthorityInterface';

const descriptors: Readonly<Record<string, EloquentRelationDescriptor | undefined>> = Object.freeze({
  hasOne: { type: { kind: 'has_one' }, relation: { kind: 'has_one' }, cardinality: { kind: 'one' }, polymorphism: { kind: 'non_polymorphic' } },
  hasMany: { type: { kind: 'has_many' }, relation: { kind: 'has_many' }, cardinality: { kind: 'many' }, polymorphism: { kind: 'non_polymorphic' } },
  belongsTo: { type: { kind: 'belongs_to' }, relation: { kind: 'belongs_to' }, cardinality: { kind: 'one' }, polymorphism: { kind: 'non_polymorphic' } },
  belongsToMany: { type: { kind: 'belongs_to_many' }, relation: { kind: 'belongs_to_many' }, cardinality: { kind: 'many' }, polymorphism: { kind: 'non_polymorphic' } },
  hasOneThrough: { type: { kind: 'has_one_through' }, relation: { kind: 'has_one_through' }, cardinality: { kind: 'one' }, polymorphism: { kind: 'non_polymorphic' } },
  hasManyThrough: { type: { kind: 'has_many_through' }, relation: { kind: 'has_many_through' }, cardinality: { kind: 'many' }, polymorphism: { kind: 'non_polymorphic' } },
  morphTo: { type: { kind: 'morph_to' }, relation: { kind: 'morph_to' }, cardinality: { kind: 'one' }, polymorphism: { kind: 'polymorphic' } },
  morphOne: { type: { kind: 'morph_one' }, relation: { kind: 'morph_one' }, cardinality: { kind: 'one' }, polymorphism: { kind: 'polymorphic' } },
  morphMany: { type: { kind: 'morph_many' }, relation: { kind: 'morph_many' }, cardinality: { kind: 'many' }, polymorphism: { kind: 'polymorphic' } },
  morphToMany: { type: { kind: 'morph_to_many' }, relation: { kind: 'morph_to_many' }, cardinality: { kind: 'many' }, polymorphism: { kind: 'polymorphic' } },
  morphedByMany: { type: { kind: 'morphed_by_many' }, relation: { kind: 'morphed_by_many' }, cardinality: { kind: 'many' }, polymorphism: { kind: 'polymorphic' } },
});

const methodName = (method: EloquentRelationMethodName): string => method.value.value;

const judge = (method: EloquentRelationMethodName): EloquentRelationMethodJudgment => {
  const descriptor = descriptors[methodName(method)];
  return descriptor === undefined
    ? { kind: 'not_an_eloquent_relation_method', method }
    : { kind: 'recognized_eloquent_relation_method', method, descriptor };
};

export const eloquentRelationMethodAuthority: EloquentRelationMethodAuthorityInterface = Object.freeze({
  kind: 'eloquent_relation_method_authority',
  contractVersion: 1,
  judge: input => judge(input.method),
  descriptor: input => {
    const judgment = judge(input.method);
    if (judgment.kind === 'recognized_eloquent_relation_method') return judgment.descriptor;
    throw Error(`Unsupported Eloquent relation method: ${methodName(input.method)}`);
  },
  type: input => eloquentRelationMethodAuthority.descriptor(input).type,
});
