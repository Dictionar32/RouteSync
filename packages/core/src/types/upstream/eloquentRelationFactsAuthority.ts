import { eloquentRelationAstFromDescriptor } from './eloquent';
import type { EloquentRelationFactsAuthorityInterface, EloquentRelationFactsEvidence, EloquentRelationFactsJudgment, EloquentRelationKeyArgumentEvidence } from './eloquentRelationFactsAuthorityInterface';
import { eloquentRelationMethodAuthority } from './eloquentRelationMethodAuthority';
import { createClassName, createColumnName, createModelName } from './names';
import { eloquentRelationMultiplicity } from './modelVocabulary';
import type { TypeExpression } from './typeVocabulary';

const modelReference = (name: string): TypeExpression => ({ kind: 'reference', value: { kind: 'class', name: createClassName(name) } });

const directForeignKeyRelation = (method: string): boolean => method === 'belongsTo' || method === 'hasMany' || method === 'hasOne';

const namedArgumentValue = (argument: EloquentRelationKeyArgumentEvidence, expectedName: string): ReturnType<typeof createColumnName> | undefined => {
  if (argument.kind === 'named_literal_string' && argument.name === expectedName) return argument.value;
  return undefined;
};

const positionalOrNamedValue = (argument: EloquentRelationKeyArgumentEvidence, expectedName: string): ReturnType<typeof createColumnName> | undefined => {
  if (argument.kind === 'positional_literal_string') return argument.value;
  return namedArgumentValue(argument, expectedName);
};

const relationKey = (input: EloquentRelationFactsEvidence): import('./model').RelationKey => {
  const method = input.method.value.value;
  if (!directForeignKeyRelation(method)) return { kind: 'not_applicable' };
  const foreign = positionalOrNamedValue(input.keyArguments.second, 'foreignKey');
  const localName = method === 'belongsTo' ? 'ownerKey' : 'localKey';
  const local = positionalOrNamedValue(input.keyArguments.third, localName);
  if (foreign === undefined) return { kind: 'convention' };
  if (local === undefined) return { kind: 'explicit_foreign', foreign };
  return { kind: 'explicit', foreign, local };
};

const judge = (input: EloquentRelationFactsEvidence): EloquentRelationFactsJudgment => {
  const methodJudgment = eloquentRelationMethodAuthority.judge({ method: input.method });
  if (methodJudgment.kind === 'not_an_eloquent_relation_method') return { kind: 'not_an_eloquent_relation' };
  if (input.target.kind === 'missing_class_target') {
    return {
      kind: 'unsupported_eloquent_relation',
      method: input.method,
      reason: 'related_model_not_explicit',
      source: input.source,
    };
  }

  const targetClass = input.target.targetClass;
  const targetModel = createModelName(targetClass.value.value);
  const descriptor = methodJudgment.descriptor;
  const multiplicity = eloquentRelationMultiplicity(descriptor.cardinality);
  const semanticType: TypeExpression = multiplicity.kind === 'collection'
    ? { kind: 'array', element: modelReference(targetClass.value.value) }
    : modelReference(targetClass.value.value);
  const targetShape = multiplicity.kind === 'collection'
    ? { kind: 'collection' as const, model: targetModel }
    : { kind: 'single' as const, model: targetModel };
  const traversalTarget = multiplicity.kind === 'collection'
    ? { kind: 'collection' as const, model: targetModel }
    : { kind: 'model' as const, model: targetModel };

  return {
    kind: 'eloquent_relation_facts_produced',
    relation: eloquentRelationAstFromDescriptor({
      kind: 'eloquent_relation_ast',
      name: input.relationName,
      sourceModel: input.sourceModel,
      descriptor,
      targetModel,
      targetClass,
      invocation: input.invocation,
      source: input.source,
      semanticType,
      targetShape,
      traversalTarget,
      key: relationKey(input),
    }),
  };
};

export const eloquentRelationFactsAuthority: EloquentRelationFactsAuthorityInterface = Object.freeze({
  kind: 'eloquent_relation_facts_authority',
  contractVersion: 1,
  judge,
});
