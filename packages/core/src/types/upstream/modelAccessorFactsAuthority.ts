import type { Expression } from './expression';
import type { ModelAccessorFact } from './modelSourceFacts';
import type { ModelAccessorFactsAuthorityInterface, ModelAccessorMethodEvidence, ModelAccessorReturnTypeEvidence } from './modelAccessorFactsAuthorityInterface';
import type { TypeExpression } from './typeVocabulary';
import { createPropertyName } from './names';

 type AccessorReturnType =
  | { readonly kind: 'textual'; readonly primitive: { readonly kind: 'string' } }
  | { readonly kind: 'numeric'; readonly primitive: { readonly kind: 'number' } }
  | { readonly kind: 'boolean'; readonly primitive: { readonly kind: 'boolean' } }
  | { readonly kind: 'array'; readonly primitive: { readonly kind: 'json' } };

const accessorReturnTypes: Readonly<Record<AccessorReturnType['kind'], AccessorReturnType>> = Object.freeze({
  textual: { kind: 'textual', primitive: { kind: 'string' } },
  numeric: { kind: 'numeric', primitive: { kind: 'number' } },
  boolean: { kind: 'boolean', primitive: { kind: 'boolean' } },
  array: { kind: 'array', primitive: { kind: 'json' } },
});

const numericHints = Object.freeze(['float', 'int', 'integer', 'number']);
const booleanHints = Object.freeze(['bool', 'boolean']);
const arrayHints = Object.freeze(['array']);

const normalizedHint = (evidence: ModelAccessorReturnTypeEvidence): string =>
  evidence.kind === 'class_reference' ? evidence.className.value.value.toLowerCase() : 'string';

const returnTypeFor = (evidence: ModelAccessorReturnTypeEvidence, modern: boolean): AccessorReturnType => {
  const hint = modern ? 'string' : normalizedHint(evidence);
  const candidates = [
    ...numericHints.filter(candidate => candidate === hint).map(() => accessorReturnTypes.numeric),
    ...booleanHints.filter(candidate => candidate === hint).map(() => accessorReturnTypes.boolean),
    ...arrayHints.filter(candidate => candidate === hint).map(() => accessorReturnTypes.array),
  ];
  return candidates[0] ?? accessorReturnTypes.textual;
};

const semanticType = (type: AccessorReturnType): TypeExpression => ({ kind: 'primitive', value: type.primitive });
const isLegacyAccessor = (name: string): boolean => name.startsWith('get') && name.endsWith('Attribute');
const isModernAccessor = (evidence: ModelAccessorMethodEvidence): boolean =>
  evidence.returnType.kind === 'class_reference' && evidence.returnType.className.value.value === 'Attribute';
const propertyNameFor = (name: string, legacy: boolean): string => {
  const core = name.slice(3, name.length - 9);
  const first = core.charAt(0).toLowerCase();
  return legacy ? first + core.slice(1) : name;
};
const accessorResult = (type: TypeExpression) => ({ kind: 'present' as const, type });
const computationFor = (evidence: ModelAccessorMethodEvidence, result: TypeExpression) => {
  const expression = evidence.returnedExpressions[0];
  return expression === undefined
    ? { kind: 'rejected' as const, expression: { kind: 'unsupported_expression' as const, reason: { kind: 'missing_return_expression' as const }, source: evidence.source }, result }
    : { kind: 'expression' as const, expression, result };
};
const factFor = (evidence: ModelAccessorMethodEvidence, legacy: boolean, modern: boolean): ModelAccessorFact => {
  const resultType = semanticType(returnTypeFor(evidence.returnType, modern));
  const methodName = evidence.method.value.value;
  return Object.freeze({
    kind: 'model_accessor',
    method: evidence.method,
    property: createPropertyName(propertyNameFor(methodName, legacy)),
    visibility: evidence.visibility,
    computation: computationFor(evidence, resultType),
    result: accessorResult(resultType),
    source: evidence.source,
  });
};
const factsFor = (evidence: ModelAccessorMethodEvidence): readonly ModelAccessorFact[] => {
  const methodName = evidence.method.value.value;
  const legacy = isLegacyAccessor(methodName);
  const modern = isModernAccessor(evidence);
  return [legacy, modern].filter(Boolean).slice(0, 1).map(() => factFor(evidence, legacy, modern));
};

export const modelAccessorFactsAuthority: ModelAccessorFactsAuthorityInterface = Object.freeze({
  kind: 'model_accessor_facts_authority',
  contractVersion: 1,
  judge: input => Object.freeze(input.evidence.flatMap(factsFor)),
});
