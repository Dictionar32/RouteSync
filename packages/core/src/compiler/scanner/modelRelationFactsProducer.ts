import type { EloquentRelationAst } from '../../types/upstream/eloquent';
import { eloquentRelationFactsAuthority } from '../../types/upstream/eloquentRelationFactsAuthority';
import type { EloquentRelationFactsJudgment, EloquentRelationTargetEvidence } from '../../types/upstream/eloquentRelationFactsAuthorityInterface';
import type { EloquentRelationMethodName } from '../../types/upstream/eloquentRelationMethodAuthorityInterface';
import { createClassName, createColumnName, createModelName, createRelationName, stringValue } from '../../types/upstream/names';
import type { ModelName } from '../../types/upstream/names';
import type { SourceSpan } from '../../types/upstream/provenance';
import type { EloquentRelationKeyArgumentEvidence, EloquentRelationKeyArgumentsEvidence, EloquentRelationKeyArgumentName } from '../../types/upstream/eloquentRelationFactsAuthorityInterface';
import type { ModelDeclarationAst } from './lexer';
import type { PhpArgument } from './lexer/phpAstExpressionTypes';
import { expressionFromPhpAst } from './operations/expressionProducer';
import { extractClassBasename } from '../../utils/resource-naming';

export interface ModelRelationFactsProducerInterface {
  readonly kind: 'model_relation_facts_producer';
  readonly contractVersion: 1;
  scan(input: { readonly declaration: ModelDeclarationAst; readonly sourceModel: ModelName; readonly source: SourceSpan }): readonly EloquentRelationAst[];
}

const methodName = (value: string): EloquentRelationMethodName => ({
  kind: 'eloquent_relation_method_name',
  value: stringValue(value),
});

const namedArgumentName = (name: string): EloquentRelationKeyArgumentName =>
  name === 'foreignKey' || name === 'ownerKey' || name === 'localKey' ? name : 'other_named';

const keyArgumentEvidenceAt = (argumentsList: readonly PhpArgument[], index: number): EloquentRelationKeyArgumentEvidence => {
  const argument = argumentsList[index];
  if (argument === undefined) return { kind: 'argument_absent' };
  if (argument.kind === 'unpacked') return { kind: 'unpacked_argument' };
  if (argument.kind === 'named') {
    const name = namedArgumentName(argument.name);
    return argument.value.kind === 'literal' && argument.value.literalType === 'string'
      ? { kind: 'named_literal_string', name, value: createColumnName(argument.value.value) }
      : { kind: 'named_other', name };
  }
  return argument.value.kind === 'literal' && argument.value.literalType === 'string'
    ? { kind: 'positional_literal_string', value: createColumnName(argument.value.value) }
    : { kind: 'positional_other' };
};

const keyArgumentsEvidence = (argumentsList: readonly PhpArgument[]): EloquentRelationKeyArgumentsEvidence => ({
  kind: 'eloquent_relation_key_arguments_evidence',
  second: keyArgumentEvidenceAt(argumentsList, 1),
  third: keyArgumentEvidenceAt(argumentsList, 2),
});

const targetEvidence = (argumentsList: readonly PhpArgument[]): EloquentRelationTargetEvidence => {
  const argument = argumentsList.find(candidate => candidate.kind !== 'unpacked' && candidate.value.kind === 'class_reference');
  if (argument === undefined || argument.kind === 'unpacked' || argument.value.kind !== 'class_reference') {
    return { kind: 'missing_class_target' };
  }
  return {
    kind: 'explicit_class_target',
    targetClass: createClassName(extractClassBasename(argument.value.className)),
  };
};

const judgmentRelations = (judgment: EloquentRelationFactsJudgment): readonly EloquentRelationAst[] => {
  if (judgment.kind === 'eloquent_relation_facts_produced') return [judgment.relation];
  if (judgment.kind === 'not_an_eloquent_relation') return [];
  throw Error(`Unsupported Eloquent relation ${judgment.method.value.value}: ${judgment.reason} at ${judgment.source.file.value.value} (offset ${judgment.source.start.value})`);
};

const relationForReturn = (
  method: ModelDeclarationAst['methods'][number],
  returned: ModelDeclarationAst['methods'][number]['returns'][number],
  sourceModel: ModelName,
  source: SourceSpan,
): readonly EloquentRelationAst[] => {
  if (returned.kind !== 'method_chain') return [];
  if (returned.receiver.kind !== 'variable_reference' || returned.receiver.name !== 'this') return [];

  const relationMethod = methodName(returned.property);
  const invocation = expressionFromPhpAst.project({ syntax: returned, sourceFile: source.file });
  const judgment = eloquentRelationFactsAuthority.judge({
    kind: 'eloquent_relation_facts_evidence',
    method: relationMethod,
    relationName: createRelationName(method.name),
    sourceModel,
    target: targetEvidence(returned.arguments),
    invocation,
    source,
    keyArguments: keyArgumentsEvidence(returned.arguments),
  });
  return judgmentRelations(judgment);
};

const scan = (input: Parameters<ModelRelationFactsProducerInterface['scan']>[0]): readonly EloquentRelationAst[] =>
  input.declaration.methods.flatMap(method => method.returns.flatMap(returned => relationForReturn(method, returned, input.sourceModel, input.source)));

export const modelRelationFactsProducer: ModelRelationFactsProducerInterface = Object.freeze({
  kind: 'model_relation_facts_producer',
  contractVersion: 1,
  scan,
});
