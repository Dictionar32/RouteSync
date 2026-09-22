/**
 * Lowers the existing ValidationRuleNode ADT into the existing MappedField
 * contract. Rule meaning is dispatched by the domain visitor; this mapper
 * contains no rule-name switch and accepts no free-form rule object.
 */

import {
  PrimitiveType,
  PrimitiveKind,
  ReadonlyCollectionType,
  CollectionKind,
  type SemanticType
} from '../../../types/SemanticType';
import {
  matchValidationRule,
  ValidationRuleNodeFactory,
  type ValidationRuleNode,
  type ValidationRuleVisitor
} from '../../../types/domain/validationRules';
import type { FileValidationConstraint, FileValidationConstraints } from '../../../types/domain/request';
import type { MappedField } from './types';

const stringType = (): SemanticType => new PrimitiveType(PrimitiveKind.STRING);

const constraint = {
  image: (): FileValidationConstraint => Object.freeze({
    kind: 'image',
    accept: <T>(visitor: { readonly image: (value: { readonly kind: 'image' }) => T; readonly extensions: (value: { readonly kind: 'extensions'; readonly values: readonly string[] }) => T; readonly mimeTypes: (value: { readonly kind: 'mime_types'; readonly values: readonly string[] }) => T; readonly maxBytes: (value: { readonly kind: 'max_bytes'; readonly value: number }) => T }) => visitor.image({ kind: 'image' })
  }),
  extensions: (values: readonly string[]): FileValidationConstraint => Object.freeze({
    kind: 'extensions',
    values: Object.freeze([...values]),
    accept: <T>(visitor: { readonly image: (value: { readonly kind: 'image' }) => T; readonly extensions: (value: { readonly kind: 'extensions'; readonly values: readonly string[] }) => T; readonly mimeTypes: (value: { readonly kind: 'mime_types'; readonly values: readonly string[] }) => T; readonly maxBytes: (value: { readonly kind: 'max_bytes'; readonly value: number }) => T }) => visitor.extensions({ kind: 'extensions', values: Object.freeze([...values]) })
  }),
  mimeTypes: (values: readonly string[]): FileValidationConstraint => Object.freeze({
    kind: 'mime_types',
    values: Object.freeze([...values]),
    accept: <T>(visitor: { readonly image: (value: { readonly kind: 'image' }) => T; readonly extensions: (value: { readonly kind: 'extensions'; readonly values: readonly string[] }) => T; readonly mimeTypes: (value: { readonly kind: 'mime_types'; readonly values: readonly string[] }) => T; readonly maxBytes: (value: { readonly kind: 'max_bytes'; readonly value: number }) => T }) => visitor.mimeTypes({ kind: 'mime_types', values: Object.freeze([...values]) })
  }),
  maxBytes: (value: number): FileValidationConstraint => Object.freeze({
    kind: 'max_bytes',
    value,
    accept: <T>(visitor: { readonly image: (value: { readonly kind: 'image' }) => T; readonly extensions: (value: { readonly kind: 'extensions'; readonly values: readonly string[] }) => T; readonly mimeTypes: (value: { readonly kind: 'mime_types'; readonly values: readonly string[] }) => T; readonly maxBytes: (value: { readonly kind: 'max_bytes'; readonly value: number }) => T }) => visitor.maxBytes({ kind: 'max_bytes', value })
  })
} as const;

type RuleEffect = {
  readonly type: SemanticType;
  readonly required: boolean;
  readonly nullable: boolean;
  readonly fileConstraints: FileValidationConstraints;
  readonly maxBytes: readonly number[];
};

const emptyEffect = (type: SemanticType = stringType()): RuleEffect => ({
  type,
  required: false,
  nullable: false,
  fileConstraints: [],
  maxBytes: []
});

type ArrayElementType = Extract<ValidationRuleNode, { readonly kind: 'array' }>['elementType'];
const ARRAY_ELEMENT_TYPES: {
  readonly [K in ArrayElementType['kind']]: (element: Extract<ArrayElementType, { readonly kind: K }>) => SemanticType;
} = {
  unspecified: () => stringType(),
  specified: element => element.type
};

const EFFECTS: ValidationRuleVisitor<RuleEffect> = {
  required: () => ({ ...emptyEffect(), required: true }),
  required_with: emptyEffect,
  nullable: () => ({ ...emptyEffect(), nullable: true }),
  optional: emptyEffect,
  string: () => emptyEffect(new PrimitiveType(PrimitiveKind.STRING)),
  number: () => emptyEffect(new PrimitiveType(PrimitiveKind.NUMBER)),
  boolean: () => emptyEffect(new PrimitiveType(PrimitiveKind.BOOLEAN)),
  array: rule => ({ ...emptyEffect(new ReadonlyCollectionType(CollectionKind.ARRAY, ARRAY_ELEMENT_TYPES[rule.elementType.kind](rule.elementType))) }),
  email: emptyEffect,
  url: emptyEffect,
  uuid: emptyEffect,
  date: () => emptyEffect(new PrimitiveType(PrimitiveKind.DATETIME)),
  min: emptyEffect,
  max: rule => ({ ...emptyEffect(), maxBytes: [rule.value.value * 1024] }),
  between: emptyEffect,
  in: emptyEffect,
  exists: emptyEffect,
  unique: emptyEffect,
  file: () => emptyEffect(new PrimitiveType(PrimitiveKind.FILE)),
  image: () => ({ ...emptyEffect(new PrimitiveType(PrimitiveKind.FILE)), fileConstraints: [constraint.image()] }),
  custom: emptyEffect
};

const FILE_MAX_CONSTRAINTS = (values: readonly number[]): FileValidationConstraints => Object.freeze(values.map(constraint.maxBytes));

const PRIMITIVE_MAX_CONSTRAINTS: { readonly [K in PrimitiveKind]: (values: readonly number[]) => FileValidationConstraints } = Object.freeze({
  [PrimitiveKind.STRING]: () => [],
  [PrimitiveKind.NUMBER]: () => [],
  [PrimitiveKind.BOOLEAN]: () => [],
  [PrimitiveKind.DATETIME]: () => [],
  [PrimitiveKind.FILE]: FILE_MAX_CONSTRAINTS,
  [PrimitiveKind.UNKNOWN]: () => [],
  [PrimitiveKind.UNSPECIFIED]: () => []
});

const reduceEffects = (effects: readonly RuleEffect[]): MappedField => {
  const reduced = effects.reduce(
    (field, effect) => ({
      type: effect.type,
      required: field.required || effect.required,
      nullable: field.nullable || effect.nullable,
      fileConstraints: Object.freeze([...field.fileConstraints, ...effect.fileConstraints]),
      maxBytes: Object.freeze([...field.maxBytes, ...effect.maxBytes])
    }),
    { type: stringType(), required: false, nullable: false, fileConstraints: [], maxBytes: [] as readonly number[] }
  );
  const maxConstraints = reduced.type.accept({
    primitive: type => PRIMITIVE_MAX_CONSTRAINTS[type.type](reduced.maxBytes),
    jsonValue: () => [],
    optional: () => [], nullable: () => [], never: () => [], error: () => [], reference: () => [],
    union: () => [], intersection: () => [], readonlyCollection: () => [], mutableCollection: () => [], generic: () => [], object: () => []
  });
  return {
    type: reduced.type,
    required: reduced.required,
    nullable: reduced.nullable,
    fileConstraints: Object.freeze([...reduced.fileConstraints, ...maxConstraints])
  };
};

export function mapRulesToField(rules: readonly ValidationRuleNode[]): MappedField {
  const canonicalRules: readonly ValidationRuleNode[] = Object.freeze([
    ValidationRuleNodeFactory.string(),
    ...rules
  ]);
  return reduceEffects(canonicalRules.map(rule => matchValidationRule(rule, EFFECTS)));
}
