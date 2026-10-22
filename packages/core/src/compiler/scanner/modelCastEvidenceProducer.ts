import type { ModelDeclarationAst } from './lexer';
import type { PhpClassPropertyAst } from './lexer';
import type { PhpAstValue } from './lexer';
import type { SourceSpan } from '../../types/upstream/provenance';
import type { ModelCastSourceEvidence, ModelCastTargetSourceEvidence } from '../../types/upstream/modelCastFactsAuthorityInterface';
import { createClassName, createPropertyName } from '../../types/upstream/names';
import { stringValue } from '../../types/upstream/valueObjects';

export interface ModelCastEvidenceProductionInput {
  readonly propertyAsts: readonly PhpClassPropertyAst[];
  readonly declaration: ModelDeclarationAst;
  readonly source: SourceSpan;
}

export interface ModelCastEvidenceProducerInterface {
  readonly kind: 'model_cast_evidence_producer';
  readonly contractVersion: 1;
  readonly produce: (input: ModelCastEvidenceProductionInput) => readonly ModelCastSourceEvidence[];
}

type StringLiteral = Extract<PhpAstValue, { readonly kind: 'literal'; readonly literalType: 'string' }>;
type ClassReference = Extract<PhpAstValue, { readonly kind: 'class_reference' }>;
type NestedArray = Extract<PhpAstValue, { readonly kind: 'nested_array' }>;
type KeyedEntry = Extract<NestedArray['entries'][number], { readonly kind: 'keyed' }>;
type StringKeyedEntry = KeyedEntry & { readonly key: Extract<KeyedEntry['key'], { readonly kind: 'string' }> };

const isStringLiteral = (value: PhpAstValue): value is StringLiteral => value.kind === 'literal' && value.literalType === 'string';
const isClassReference = (value: PhpAstValue): value is ClassReference => value.kind === 'class_reference';
const isNestedArray = (value: PhpAstValue): value is NestedArray => value.kind === 'nested_array';
const isStringKeyedEntry = (entry: NestedArray['entries'][number]): entry is StringKeyedEntry => entry.kind === 'keyed' && entry.key.kind === 'string';

const targetEvidence = (value: PhpAstValue): ModelCastTargetSourceEvidence => {
  const literals = [value].filter(isStringLiteral).map(item => item.value);
  const classes = [value].filter(isClassReference).map(item => item.className);
  const literal = literals[0];
  const className = classes[0];
  if (literal !== undefined) return Object.freeze({ kind: 'literal_cast_target', value: stringValue(literal) });
  if (className !== undefined) return Object.freeze({ kind: 'class_cast_target', className: createClassName(className) });
  throw Error('Model cast evidence requires a string literal or class reference');
};

const evidenceFromArray = (value: PhpAstValue, source: SourceSpan): readonly ModelCastSourceEvidence[] =>
  [value].filter(isNestedArray).flatMap(array => array.entries.filter(isStringKeyedEntry).map(entry => Object.freeze({
    kind: 'model_cast_source_evidence' as const,
    property: createPropertyName(entry.key.value),
    target: targetEvidence(entry.value),
    source,
  })));

const propertyEvidence = (properties: readonly PhpClassPropertyAst[], source: SourceSpan): readonly ModelCastSourceEvidence[] =>
  properties.filter(property => property.name === '$casts' && property.initialization.kind === 'present')
    .flatMap(property => property.initialization.kind === 'present' ? evidenceFromArray(property.initialization.value, source) : []);

const methodEvidence = (declaration: ModelDeclarationAst, source: SourceSpan): readonly ModelCastSourceEvidence[] =>
  declaration.methods.filter(method => method.name === 'casts')
    .flatMap(method => method.returns.flatMap(returned => evidenceFromArray(returned, source)));

export const modelCastEvidenceProducer: ModelCastEvidenceProducerInterface = Object.freeze({
  kind: 'model_cast_evidence_producer',
  contractVersion: 1,
  produce: input => Object.freeze([
    ...propertyEvidence(input.propertyAsts, input.source),
    ...methodEvidence(input.declaration, input.source),
  ]),
});
