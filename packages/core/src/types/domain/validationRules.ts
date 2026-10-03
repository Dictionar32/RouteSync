import type { SemanticType } from "../../compiler/types/SemanticType";
import type { Expression } from '../upstream/expression';
import type { ColumnName, DateFormat, TableName, ValidationConstraintValue, ValidationParameter, ValidationRuleName, PropertyName } from "./semanticValues";
import type { RequestField } from "./request";
import type { SourceSpan } from '../upstream/provenance';
import { SemanticValueFactory } from './semanticValues';
import { relationAnyMatch, relationFirst, relationFold, relationOptionFold, relationProject, relationResolve, relationRefine } from '../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../semantic/kernel/semanticRelations';

/**
 * ValidationRuleKind
 *
 * Canonical Domain Vocabulary for Laravel Validation Rules.
 */
export const ValidationRuleKind = Object.freeze({
  Required: 'required',
  RequiredWith: 'required_with',
  RequiredWithAll: 'required_with_all',
  RequiredWithout: 'required_without',
  RequiredWithoutAll: 'required_without_all',
  RequiredIf: 'required_if',
  RequiredUnless: 'required_unless',
  Nullable: 'nullable',
  Optional: 'optional',
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Array: 'array',
  Email: 'email',
  Url: 'url',
  Uuid: 'uuid',
  Date: 'date',
  Min: 'min',
  Max: 'max',
  Between: 'between',
  In: 'in',
  Exists: 'exists',
  Unique: 'unique',
  File: 'file',
  Image: 'image',
  Custom: 'custom'
} as const);

export type ValidationRuleKind = typeof ValidationRuleKind[keyof typeof ValidationRuleKind];

export interface BaseValidationRuleNode<K extends ValidationRuleKind = ValidationRuleKind> {
  readonly kind: K;
}

export interface RequiredValidationRuleNode extends BaseValidationRuleNode<'required'> {
  readonly kind: 'required';
}

export interface RequiredWithValidationRuleNode extends BaseValidationRuleNode<'required_with'> { readonly kind: 'required_with'; readonly fields: readonly PropertyName[]; }
export interface RequiredWithAllValidationRuleNode extends BaseValidationRuleNode<'required_with_all'> { readonly kind: 'required_with_all'; readonly fields: readonly PropertyName[]; }
export interface RequiredWithoutValidationRuleNode extends BaseValidationRuleNode<'required_without'> { readonly kind: 'required_without'; readonly fields: readonly PropertyName[]; }
export interface RequiredWithoutAllValidationRuleNode extends BaseValidationRuleNode<'required_without_all'> { readonly kind: 'required_without_all'; readonly fields: readonly PropertyName[]; }
export interface RequiredIfValidationRuleNode extends BaseValidationRuleNode<'required_if'> { readonly kind: 'required_if'; readonly field: PropertyName; readonly values: readonly ValidationParameter[]; }
export interface RequiredUnlessValidationRuleNode extends BaseValidationRuleNode<'required_unless'> { readonly kind: 'required_unless'; readonly field: PropertyName; readonly values: readonly ValidationParameter[]; }

export interface NullableValidationRuleNode extends BaseValidationRuleNode<'nullable'> {
  readonly kind: 'nullable';
}

export interface OptionalValidationRuleNode extends BaseValidationRuleNode<'optional'> {
  readonly kind: 'optional';
}

export interface StringValidationRuleNode extends BaseValidationRuleNode<'string'> {
  readonly kind: 'string';
}

export interface NumberValidationRuleNode extends BaseValidationRuleNode<'number'> {
  readonly kind: 'number';
}

export interface BooleanValidationRuleNode extends BaseValidationRuleNode<'boolean'> {
  readonly kind: 'boolean';
}

export type ArrayElementType =
  | { readonly kind: 'unspecified' }
  | { readonly kind: 'specified'; readonly type: SemanticType };

export interface ArrayValidationRuleNode extends BaseValidationRuleNode<'array'> {
  readonly kind: 'array';
  readonly elementType: ArrayElementType;
}

export interface EmailValidationRuleNode extends BaseValidationRuleNode<'email'> {
  readonly kind: 'email';
}

export interface UrlValidationRuleNode extends BaseValidationRuleNode<'url'> {
  readonly kind: 'url';
}

export interface UuidValidationRuleNode extends BaseValidationRuleNode<'uuid'> {
  readonly kind: 'uuid';
}

export type DateFormatSpecification =
  | { readonly kind: 'unspecified' }
  | { readonly kind: 'specified'; readonly format: DateFormat };

export interface DateValidationRuleNode extends BaseValidationRuleNode<'date'> {
  readonly kind: 'date';
  readonly format: DateFormatSpecification;
}

export interface MinValidationRuleNode extends BaseValidationRuleNode<'min'> {
  readonly kind: 'min';
  readonly value: ValidationConstraintValue;
}

export interface MaxValidationRuleNode extends BaseValidationRuleNode<'max'> {
  readonly kind: 'max';
  readonly value: ValidationConstraintValue;
}

export interface BetweenValidationRuleNode extends BaseValidationRuleNode<'between'> {
  readonly kind: 'between';
  readonly min: ValidationConstraintValue;
  readonly max: ValidationConstraintValue;
}

export interface InValidationRuleNode extends BaseValidationRuleNode<'in'> {
  readonly kind: 'in';
  readonly values: readonly ValidationParameter[];
}

export type ValidationDatabaseColumn =
  | { readonly kind: 'default_column' }
  | { readonly kind: 'explicit_column'; readonly column: ColumnName };

export interface ExistsValidationRuleNode extends BaseValidationRuleNode<'exists'> {
  readonly kind: 'exists';
  readonly table: TableName;
  readonly column: ValidationDatabaseColumn;
}

export type UniqueValidationTarget =
  | { readonly kind: 'all' }
  | { readonly kind: 'ignore'; readonly value: Expression };

export interface UniqueValidationRuleNode extends BaseValidationRuleNode<'unique'> {
  readonly kind: 'unique';
  readonly table: TableName;
  readonly column: ValidationDatabaseColumn;
  readonly target: UniqueValidationTarget;
}

export interface FileValidationRuleNode extends BaseValidationRuleNode<'file'> {
  readonly kind: 'file';
}

export interface ImageValidationRuleNode extends BaseValidationRuleNode<'image'> {
  readonly kind: 'image';
}

export interface CustomValidationRuleNode extends BaseValidationRuleNode<'custom'> {
  readonly kind: 'custom';
  readonly rule: ValidationRuleName;
  readonly parameters: readonly ValidationParameter[];
}

export type ValidationRuleNode =
  | RequiredValidationRuleNode
  | RequiredWithValidationRuleNode
  | RequiredWithAllValidationRuleNode
  | RequiredWithoutValidationRuleNode
  | RequiredWithoutAllValidationRuleNode
  | RequiredIfValidationRuleNode
  | RequiredUnlessValidationRuleNode
  | NullableValidationRuleNode
  | OptionalValidationRuleNode
  | StringValidationRuleNode
  | NumberValidationRuleNode
  | BooleanValidationRuleNode
  | ArrayValidationRuleNode
  | EmailValidationRuleNode
  | UrlValidationRuleNode
  | UuidValidationRuleNode
  | DateValidationRuleNode
  | MinValidationRuleNode
  | MaxValidationRuleNode
  | BetweenValidationRuleNode
  | InValidationRuleNode
  | ExistsValidationRuleNode
  | UniqueValidationRuleNode
  | FileValidationRuleNode
  | ImageValidationRuleNode
  | CustomValidationRuleNode;

export type AnyValidationRuleNode = ValidationRuleNode;

export type ValidationRuleCategory =
  | 'modifier'
  | 'type'
  | 'format'
  | 'constraint'
  | 'database'
  | 'custom';

export interface ValidationRuleSpecification<K extends ValidationRuleKind = ValidationRuleKind> {
  readonly kind: K;
  readonly category: ValidationRuleCategory;
  readonly description: string;
}

export type ValidationRuleRegistry = {
  readonly [K in ValidationRuleKind]: ValidationRuleSpecification<K>;
};

export const VALIDATION_RULE_REGISTRY: ValidationRuleRegistry = Object.freeze({
  [ValidationRuleKind.Required]: {
    kind: ValidationRuleKind.Required,
    category: 'modifier',
    description: 'Field must be present and not empty'
  },
  [ValidationRuleKind.RequiredWith]: {
    kind: ValidationRuleKind.RequiredWith,
    category: 'modifier',
    description: 'Field is required when one or more other fields are present'
  },
  [ValidationRuleKind.RequiredWithAll]: { kind: ValidationRuleKind.RequiredWithAll, category: 'modifier', description: 'Field is required when all referenced fields are present' },
  [ValidationRuleKind.RequiredWithout]: { kind: ValidationRuleKind.RequiredWithout, category: 'modifier', description: 'Field is required when one or more referenced fields are absent' },
  [ValidationRuleKind.RequiredWithoutAll]: { kind: ValidationRuleKind.RequiredWithoutAll, category: 'modifier', description: 'Field is required when all referenced fields are absent' },
  [ValidationRuleKind.RequiredIf]: { kind: ValidationRuleKind.RequiredIf, category: 'modifier', description: 'Field is required when a referenced field has one of the supplied values' },
  [ValidationRuleKind.RequiredUnless]: { kind: ValidationRuleKind.RequiredUnless, category: 'modifier', description: 'Field is required unless a referenced field has one of the supplied values' },
  [ValidationRuleKind.Nullable]: {
    kind: ValidationRuleKind.Nullable,
    category: 'modifier',
    description: 'Field may be null'
  },
  [ValidationRuleKind.Optional]: {
    kind: ValidationRuleKind.Optional,
    category: 'modifier',
    description: 'Field may be omitted/sometimes'
  },
  [ValidationRuleKind.String]: {
    kind: ValidationRuleKind.String,
    category: 'type',
    description: 'Field must be a string'
  },
  [ValidationRuleKind.Number]: {
    kind: ValidationRuleKind.Number,
    category: 'type',
    description: 'Field must be numeric'
  },
  [ValidationRuleKind.Boolean]: {
    kind: ValidationRuleKind.Boolean,
    category: 'type',
    description: 'Field must be a boolean'
  },
  [ValidationRuleKind.Array]: {
    kind: ValidationRuleKind.Array,
    category: 'type',
    description: 'Field must be an array'
  },
  [ValidationRuleKind.Email]: {
    kind: ValidationRuleKind.Email,
    category: 'format',
    description: 'Field must be formatted as an e-mail address'
  },
  [ValidationRuleKind.Url]: {
    kind: ValidationRuleKind.Url,
    category: 'format',
    description: 'Field must be formatted as a valid URL'
  },
  [ValidationRuleKind.Uuid]: {
    kind: ValidationRuleKind.Uuid,
    category: 'format',
    description: 'Field must be a valid UUID'
  },
  [ValidationRuleKind.Date]: {
    kind: ValidationRuleKind.Date,
    category: 'format',
    description: 'Field must be a valid date'
  },
  [ValidationRuleKind.Min]: {
    kind: ValidationRuleKind.Min,
    category: 'constraint',
    description: 'Field must have minimum value or length'
  },
  [ValidationRuleKind.Max]: {
    kind: ValidationRuleKind.Max,
    category: 'constraint',
    description: 'Field must have maximum value or length'
  },
  [ValidationRuleKind.Between]: {
    kind: ValidationRuleKind.Between,
    category: 'constraint',
    description: 'Field must be between min and max values'
  },
  [ValidationRuleKind.In]: {
    kind: ValidationRuleKind.In,
    category: 'constraint',
    description: 'Field must be included in given list of values'
  },
  [ValidationRuleKind.Exists]: {
    kind: ValidationRuleKind.Exists,
    category: 'database',
    description: 'Field must exist in specified database table'
  },
  [ValidationRuleKind.Unique]: {
    kind: ValidationRuleKind.Unique,
    category: 'database',
    description: 'Field must be unique in specified database table'
  },
  [ValidationRuleKind.File]: {
    kind: ValidationRuleKind.File,
    category: 'type',
    description: 'Field must be an uploaded file'
  },
  [ValidationRuleKind.Image]: {
    kind: ValidationRuleKind.Image,
    category: 'type',
    description: 'Field must be an uploaded image file'
  },
  [ValidationRuleKind.Custom]: {
    kind: ValidationRuleKind.Custom,
    category: 'custom',
    description: 'Custom or unhandled Laravel validation rule'
  }
});

export type ValidationRuleVisitor<R> = {
  readonly required: (rule: RequiredValidationRuleNode) => R;
  readonly required_with: (rule: RequiredWithValidationRuleNode) => R;
  readonly required_with_all: (rule: RequiredWithAllValidationRuleNode) => R;
  readonly required_without: (rule: RequiredWithoutValidationRuleNode) => R;
  readonly required_without_all: (rule: RequiredWithoutAllValidationRuleNode) => R;
  readonly required_if: (rule: RequiredIfValidationRuleNode) => R;
  readonly required_unless: (rule: RequiredUnlessValidationRuleNode) => R;
  readonly nullable: (rule: NullableValidationRuleNode) => R;
  readonly optional: (rule: OptionalValidationRuleNode) => R;
  readonly string: (rule: StringValidationRuleNode) => R;
  readonly number: (rule: NumberValidationRuleNode) => R;
  readonly boolean: (rule: BooleanValidationRuleNode) => R;
  readonly array: (rule: ArrayValidationRuleNode) => R;
  readonly email: (rule: EmailValidationRuleNode) => R;
  readonly url: (rule: UrlValidationRuleNode) => R;
  readonly uuid: (rule: UuidValidationRuleNode) => R;
  readonly date: (rule: DateValidationRuleNode) => R;
  readonly min: (rule: MinValidationRuleNode) => R;
  readonly max: (rule: MaxValidationRuleNode) => R;
  readonly between: (rule: BetweenValidationRuleNode) => R;
  readonly in: (rule: InValidationRuleNode) => R;
  readonly exists: (rule: ExistsValidationRuleNode) => R;
  readonly unique: (rule: UniqueValidationRuleNode) => R;
  readonly file: (rule: FileValidationRuleNode) => R;
  readonly image: (rule: ImageValidationRuleNode) => R;
  readonly custom: (rule: CustomValidationRuleNode) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian ValidationRuleNode dengan exhaustive type safety
 */
export function matchValidationRule<R>(
  rule: ValidationRuleNode,
  visitor: ValidationRuleVisitor<R>
): R {
  const apply = <K extends ValidationRuleKind>(kind: K, handler: (node: ExtractRule<K>) => R) => (candidate: ValidationRuleNode): R =>
    relationOptionFold(
      relationRefine(candidate, (value): value is ExtractRule<K> => relationEqual(value.kind, kind)),
      () => { throw Error(`Validation rule dispatch mismatch for '${kind}'`); },
      handler,
    );
  const dispatch: Readonly<Record<ValidationRuleKind, (candidate: ValidationRuleNode) => R>> = Object.freeze({
    required: apply(ValidationRuleKind.Required, visitor.required),
    required_with: apply(ValidationRuleKind.RequiredWith, visitor.required_with),
    required_with_all: apply(ValidationRuleKind.RequiredWithAll, visitor.required_with_all),
    required_without: apply(ValidationRuleKind.RequiredWithout, visitor.required_without),
    required_without_all: apply(ValidationRuleKind.RequiredWithoutAll, visitor.required_without_all),
    required_if: apply(ValidationRuleKind.RequiredIf, visitor.required_if),
    required_unless: apply(ValidationRuleKind.RequiredUnless, visitor.required_unless),
    nullable: apply(ValidationRuleKind.Nullable, visitor.nullable),
    optional: apply(ValidationRuleKind.Optional, visitor.optional),
    string: apply(ValidationRuleKind.String, visitor.string),
    number: apply(ValidationRuleKind.Number, visitor.number),
    boolean: apply(ValidationRuleKind.Boolean, visitor.boolean),
    array: apply(ValidationRuleKind.Array, visitor.array),
    email: apply(ValidationRuleKind.Email, visitor.email),
    url: apply(ValidationRuleKind.Url, visitor.url),
    uuid: apply(ValidationRuleKind.Uuid, visitor.uuid),
    date: apply(ValidationRuleKind.Date, visitor.date),
    min: apply(ValidationRuleKind.Min, visitor.min),
    max: apply(ValidationRuleKind.Max, visitor.max),
    between: apply(ValidationRuleKind.Between, visitor.between),
    in: apply(ValidationRuleKind.In, visitor.in),
    exists: apply(ValidationRuleKind.Exists, visitor.exists),
    unique: apply(ValidationRuleKind.Unique, visitor.unique),
    file: apply(ValidationRuleKind.File, visitor.file),
    image: apply(ValidationRuleKind.Image, visitor.image),
    custom: apply(ValidationRuleKind.Custom, visitor.custom),
  });
  return relationResolve(
    Object.prototype.hasOwnProperty.call(dispatch, rule.kind),
    () => dispatch[rule.kind](rule),
    () => { throw Error(`Unsupported validation rule kind: ${rule.kind}`); },
  );
}

export const matchRule = matchValidationRule;

/**
 * ValidationRuleNodeFactory
 *
 * Canonical Reusable Factory for Structured ValidationRuleNode AST.
 */
export class ValidationRuleNodeFactory {
  public static required(): RequiredValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Required }); }
  public static requiredWith(fields: readonly PropertyName[]): RequiredWithValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.RequiredWith, fields: Object.freeze([...fields]) }); }
  public static requiredWithAll(fields: readonly PropertyName[]): RequiredWithAllValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.RequiredWithAll, fields: Object.freeze([...fields]) }); }
  public static requiredWithout(fields: readonly PropertyName[]): RequiredWithoutValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.RequiredWithout, fields: Object.freeze([...fields]) }); }
  public static requiredWithoutAll(fields: readonly PropertyName[]): RequiredWithoutAllValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.RequiredWithoutAll, fields: Object.freeze([...fields]) }); }
  public static requiredIf(field: PropertyName, values: readonly ValidationParameter[]): RequiredIfValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.RequiredIf, field, values: Object.freeze([...values]) }); }
  public static requiredUnless(field: PropertyName, values: readonly ValidationParameter[]): RequiredUnlessValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.RequiredUnless, field, values: Object.freeze([...values]) }); }
  public static nullable(): NullableValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Nullable }); }
  public static optional(): OptionalValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Optional }); }
  public static string(): StringValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.String }); }
  public static number(): NumberValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Number }); }
  public static boolean(): BooleanValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Boolean }); }
  public static array(elementType: ArrayElementType = Object.freeze({ kind: 'unspecified' })): ArrayValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Array, elementType }); }
  public static email(): EmailValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Email }); }
  public static url(): UrlValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Url }); }
  public static uuid(): UuidValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Uuid }); }
  public static date(format: DateFormatSpecification = Object.freeze({ kind: 'unspecified' })): DateValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Date, format }); }
  public static min(value: ValidationConstraintValue): MinValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Min, value }); }
  public static max(value: ValidationConstraintValue): MaxValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Max, value }); }
  public static between(min: ValidationConstraintValue, max: ValidationConstraintValue): BetweenValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Between, min, max }); }
  public static in(values: readonly ValidationParameter[]): InValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.In, values: Object.freeze([...values]) }); }
  public static exists(table: TableName, column: ValidationDatabaseColumn = Object.freeze({ kind: 'default_column' })): ExistsValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Exists, table, column }); }
  public static unique(table: TableName, column: ValidationDatabaseColumn = Object.freeze({ kind: 'default_column' }), target: UniqueValidationTarget = Object.freeze({ kind: 'all' })): UniqueValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Unique, table, column, target }); }
  public static file(): FileValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.File }); }
  public static image(): ImageValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Image }); }
  public static custom(rule: ValidationRuleName, parameters: readonly ValidationParameter[] = []): CustomValidationRuleNode { return Object.freeze({ kind: ValidationRuleKind.Custom, rule, parameters: Object.freeze([...parameters]) }); }
}



/**
 * ValidationRuleParser
 *
 * Pure Deterministic AST Parser for Laravel Validation Rule Strings.
 * Transforms raw Laravel rule strings into strongly-typed ValidationRuleNode AST.
 */
function validationRuleName(value: string): ValidationRuleName { return Object.freeze({ kind: 'validation_rule_name', value }); }
function validationParameter(value: string): ValidationParameter { return Object.freeze({ kind: 'validation_parameter', value }); }
function validationConstraintValue(value: string): ValidationConstraintValue { return Object.freeze({ kind: 'validation_constraint_value', value: Number(value) }); }
function tableName(value: string): TableName { return SemanticValueFactory.tableName(value); }
function columnName(value: string): ColumnName { return SemanticValueFactory.columnName(value); }
function dateFormat(value: string): DateFormat { return Object.freeze({ kind: 'date_format', value }); }

export class ValidationRuleParser {
  public static parse(ruleStr: string): ValidationRuleNode {
    const trimmed = ruleStr.trim();
    const colonIdx = trimmed.indexOf(':');
    const name = relationResolve(relationEqual(colonIdx, -1), () => trimmed, () => trimmed.slice(0, colonIdx)).toLowerCase();
    const paramStr = relationResolve(relationEqual(colonIdx, -1), () => '', () => trimmed.slice(colonIdx + 1));
    const params = relationResolve(paramStr.length > 0, () => relationProject(paramStr.split(','), value => value.trim()), () => [] as string[]);
    const parser = VALIDATION_RULE_PARSERS[name];
    return relationResolve(
      Object.prototype.hasOwnProperty.call(VALIDATION_RULE_PARSERS, name),
      () => parser(params),
      () => parseFluentValidationRule(trimmed, name, params),
    );
  }

  public static parseAll(rules: readonly string[]): readonly ValidationRuleNode[] {
    return Object.freeze(relationProject(rules, rule => this.parse(rule)));
  }

  public static toZodExpression(rules: readonly ValidationRuleNode[]): string {
    const isRequired = relationAnyMatch(rules, rule => relationEqual(rule.kind, ValidationRuleKind.Required));
    const hasOptional = relationAnyMatch(rules, rule => relationEqual(rule.kind, ValidationRuleKind.Optional));
    const initialNode: ZodNode = { expression: 'z.string()' };
    const finalNode = ZodSchemaReducer.reduceConstraints(initialNode, rules);
    return relationResolve(
      relationAnyMatch([isRequired, hasOptional], value => relationEqual(value, false)),
      () => `${finalNode.expression}.optional()`,
      () => finalNode.expression,
    );
  }
}

const VALIDATION_RULE_PARSERS: Readonly<Record<string, (params: readonly string[]) => ValidationRuleNode>> = Object.freeze({
  required: () => ValidationRuleNodeFactory.required(),
  required_with: params => ValidationRuleNodeFactory.requiredWith(relationProject(params, value => SemanticValueFactory.propertyName(value))),
  required_with_all: params => ValidationRuleNodeFactory.requiredWithAll(relationProject(params, value => SemanticValueFactory.propertyName(value))),
  required_without: params => ValidationRuleNodeFactory.requiredWithout(relationProject(params, value => SemanticValueFactory.propertyName(value))),
  required_without_all: params => ValidationRuleNodeFactory.requiredWithoutAll(relationProject(params, value => SemanticValueFactory.propertyName(value))),
  required_if: params => relationResolve(params.length > 0, () => ValidationRuleNodeFactory.requiredIf(SemanticValueFactory.propertyName(params[0]), relationProject(params.slice(1), validationParameter)), () => ValidationRuleNodeFactory.custom(validationRuleName('required_if'), relationProject(params, validationParameter))),
  required_unless: params => relationResolve(params.length > 0, () => ValidationRuleNodeFactory.requiredUnless(SemanticValueFactory.propertyName(params[0]), relationProject(params.slice(1), validationParameter)), () => ValidationRuleNodeFactory.custom(validationRuleName('required_unless'), relationProject(params, validationParameter))),
  nullable: () => ValidationRuleNodeFactory.nullable(),
  sometimes: () => ValidationRuleNodeFactory.optional(),
  optional: () => ValidationRuleNodeFactory.optional(),
  string: () => ValidationRuleNodeFactory.string(),
  integer: () => ValidationRuleNodeFactory.number(),
  int: () => ValidationRuleNodeFactory.number(),
  numeric: () => ValidationRuleNodeFactory.number(),
  digits: () => ValidationRuleNodeFactory.number(),
  boolean: () => ValidationRuleNodeFactory.boolean(),
  bool: () => ValidationRuleNodeFactory.boolean(),
  array: () => ValidationRuleNodeFactory.array(),
  email: () => ValidationRuleNodeFactory.email(),
  url: () => ValidationRuleNodeFactory.url(),
  uuid: () => ValidationRuleNodeFactory.uuid(),
  date: params => relationResolve(params.length > 0, () => ValidationRuleNodeFactory.date({ kind: 'specified', format: dateFormat(params[0]) }), () => ValidationRuleNodeFactory.date()),
  datetime: params => relationResolve(params.length > 0, () => ValidationRuleNodeFactory.date({ kind: 'specified', format: dateFormat(params[0]) }), () => ValidationRuleNodeFactory.date()),
  timestamp: params => relationResolve(params.length > 0, () => ValidationRuleNodeFactory.date({ kind: 'specified', format: dateFormat(params[0]) }), () => ValidationRuleNodeFactory.date()),
  min: params => relationResolve(params.length > 0 && Number.isFinite(Number(params[0])), () => ValidationRuleNodeFactory.min(validationConstraintValue(params[0])), () => ValidationRuleNodeFactory.custom(validationRuleName('min'), relationProject(params, validationParameter))),
  max: params => relationResolve(params.length > 0 && Number.isFinite(Number(params[0])), () => ValidationRuleNodeFactory.max(validationConstraintValue(params[0])), () => ValidationRuleNodeFactory.custom(validationRuleName('max'), relationProject(params, validationParameter))),
  between: params => relationResolve(params.length > 1 && Number.isFinite(Number(params[0])) && Number.isFinite(Number(params[1])), () => ValidationRuleNodeFactory.between(validationConstraintValue(params[0]), validationConstraintValue(params[1])), () => ValidationRuleNodeFactory.custom(validationRuleName('between'), relationProject(params, validationParameter))),
  in: params => ValidationRuleNodeFactory.in(relationProject(params, validationParameter)),
  exists: params => relationResolve(params.length > 0, () => ValidationRuleNodeFactory.exists(tableName(params[0]), relationResolve(params.length > 1, () => ({ kind: 'explicit_column', column: columnName(params[1]) } as const), () => ({ kind: 'default_column' } as const))), () => ValidationRuleNodeFactory.custom(validationRuleName('exists'), relationProject(params, validationParameter))),
  unique: params => relationResolve(params.length > 0, () => ValidationRuleNodeFactory.unique(tableName(params[0]), relationResolve(params.length > 1, () => ({ kind: 'explicit_column', column: columnName(params[1]) } as const), () => ({ kind: 'default_column' } as const))), () => ValidationRuleNodeFactory.custom(validationRuleName('unique'), relationProject(params, validationParameter))),
  file: () => ValidationRuleNodeFactory.file(),
  image: () => ValidationRuleNodeFactory.image(),
});

const parseFluentValidationRule = (trimmed: string, name: string, params: readonly string[]): ValidationRuleNode => {
  const fluentRules: readonly { readonly matches: boolean; readonly parse: () => ValidationRuleNode }[] = [
    {
      matches: trimmed.includes('Rule::in') || trimmed.startsWith('in('),
      parse: () => {
        const match = trimmed.match(/(?:Rule::in|in)\s*\(\s*\[?([^\]\)]*)\]?\s*\)/);
        return relationOptionFold(
          relationRefine(match, (value): value is RegExpMatchArray => Boolean(value && value[1])),
          () => ValidationRuleNodeFactory.custom(validationRuleName(name), relationProject(params, validationParameter)),
          value => ValidationRuleNodeFactory.in(relationProject(value[1].split(','), item => validationParameter(item.trim().replace(/^['"]|['"]$/g, '')))),
        );
      },
    },
    { matches: trimmed.includes('Rule::unique') || trimmed.startsWith('unique('), parse: () => parseFluentDatabaseRule(trimmed, name, params, 'unique') },
    { matches: trimmed.includes('Rule::exists') || trimmed.startsWith('exists('), parse: () => parseFluentDatabaseRule(trimmed, name, params, 'exists') },
  ];
  return relationOptionFold(
    relationFirst(fluentRules, rule => rule.matches),
    () => ValidationRuleNodeFactory.custom(validationRuleName(name), relationProject(params, validationParameter)),
    rule => rule.parse(),
  );
};

const FLUENT_DATABASE_PATTERNS: Readonly<Record<'unique' | 'exists', RegExp>> = Object.freeze({
  unique: /(?:Rule::unique|unique)\s*\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/,
  exists: /(?:Rule::exists|exists)\s*\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/,
});

const FLUENT_DATABASE_FACTORIES: Readonly<Record<'unique' | 'exists', (table: TableName, column: ValidationDatabaseColumn) => ValidationRuleNode>> = Object.freeze({
  unique: (table, column) => ValidationRuleNodeFactory.unique(table, column),
  exists: (table, column) => ValidationRuleNodeFactory.exists(table, column),
});

const parseFluentDatabaseRule = (trimmed: string, name: string, params: readonly string[], kind: 'unique' | 'exists'): ValidationRuleNode => {
  const match = trimmed.match(FLUENT_DATABASE_PATTERNS[kind]);
  return relationOptionFold(
    relationRefine(match, (value): value is RegExpMatchArray => Boolean(value && value[1])),
    () => ValidationRuleNodeFactory.custom(validationRuleName(name), relationProject(params, validationParameter)),
    value => FLUENT_DATABASE_FACTORIES[kind](
      tableName(value[1]),
      relationResolve(Boolean(value[2]), () => ({ kind: 'explicit_column', column: columnName(value[2]) } as const), () => ({ kind: 'default_column' } as const)),
    ),
  );
};

export interface ZodNode {
  readonly expression: string;
}

/**
 * Ekstrak node spesifik berdasarkan kind dari discriminated union.
 */
export type ExtractRule<K extends ValidationRuleKind> = Extract<
  ValidationRuleNode,
  { readonly kind: K }
>;

/**
 * Handler strictly-typed: parameter constraint DIJAMIN cocok dengan K (0 any).
 */
export type ConstraintHandler<K extends ValidationRuleKind> = (
  base: ZodNode,
  constraint: ExtractRule<K>
) => ZodNode;

/**
 * Registry Mapped Type: Semua key K terpetakan ke handler yang eksak.
 */
export type ConstraintRegistry = {
  readonly [K in ValidationRuleKind]: ConstraintHandler<K>;
};

export const ZOD_CONSTRAINT_REGISTRY: ConstraintRegistry = Object.freeze({
  [ValidationRuleKind.Min]: (base, c) => ({
    expression: `${base.expression}.min(${c.value})`
  }),
  [ValidationRuleKind.Max]: (base, c) => ({
    expression: `${base.expression}.max(${c.value})`
  }),
  [ValidationRuleKind.In]: (base, c) => ({
    expression: `z.enum([${relationProject(c.values, v => JSON.stringify(v)).join(', ')}])`
  }),
  [ValidationRuleKind.Between]: (base, c) => ({
    expression: `${base.expression}.min(${c.min}).max(${c.max})`
  }),
  [ValidationRuleKind.Email]: (base) => ({
    expression: `${base.expression}.email()`
  }),
  [ValidationRuleKind.Url]: (base) => ({
    expression: `${base.expression}.url()`
  }),
  [ValidationRuleKind.Uuid]: (base) => ({
    expression: `${base.expression}.uuid()`
  }),
  [ValidationRuleKind.Nullable]: (base) => ({
    expression: `${base.expression}.nullable()`
  }),
  [ValidationRuleKind.Optional]: (base) => ({
    expression: `${base.expression}.optional()`
  }),
  [ValidationRuleKind.Number]: () => ({
    expression: 'z.number()'
  }),
  [ValidationRuleKind.Boolean]: () => ({
    expression: 'z.boolean()'
  }),
  [ValidationRuleKind.Array]: () => ({
    expression: 'z.array(z.unknown())'
  }),
  [ValidationRuleKind.String]: () => ({
    expression: 'z.string()'
  }),
  [ValidationRuleKind.Date]: (base) => ({
    expression: `${base.expression}.datetime()`
  }),
  [ValidationRuleKind.File]: () => ({
    expression: 'z.instanceof(File)'
  }),
  [ValidationRuleKind.Image]: () => ({
    expression: 'z.instanceof(File)'
  }),
  [ValidationRuleKind.Required]: (base) => base,
  [ValidationRuleKind.RequiredWith]: (base) => base,
  [ValidationRuleKind.RequiredWithAll]: (base) => base,
  [ValidationRuleKind.RequiredWithout]: (base) => base,
  [ValidationRuleKind.RequiredWithoutAll]: (base) => base,
  [ValidationRuleKind.RequiredIf]: (base) => base,
  [ValidationRuleKind.RequiredUnless]: (base) => base,
  [ValidationRuleKind.Exists]: (base) => base,
  [ValidationRuleKind.Unique]: (base) => base,
  [ValidationRuleKind.Custom]: (base) => base
});

export class ZodSchemaReducer {
  public static reduceConstraints(
    initialNode: ZodNode,
    constraints: readonly ValidationRuleNode[]
  ): ZodNode {
    return relationFold(constraints, initialNode, (base, constraint) =>
      matchValidationRule(constraint, {
        required: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Required](base, node),
        required_with: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.RequiredWith](base, node),
        required_with_all: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.RequiredWithAll](base, node),
        required_without: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.RequiredWithout](base, node),
        required_without_all: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.RequiredWithoutAll](base, node),
        required_if: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.RequiredIf](base, node),
        required_unless: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.RequiredUnless](base, node),
        nullable: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Nullable](base, node),
        optional: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Optional](base, node),
        string: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.String](base, node),
        number: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Number](base, node),
        boolean: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Boolean](base, node),
        array: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Array](base, node),
        email: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Email](base, node),
        url: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Url](base, node),
        uuid: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Uuid](base, node),
        date: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Date](base, node),
        min: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Min](base, node),
        max: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Max](base, node),
        between: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Between](base, node),
        in: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.In](base, node),
        exists: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Exists](base, node),
        unique: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Unique](base, node),
        file: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.File](base, node),
        image: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Image](base, node),
        custom: node => ZOD_CONSTRAINT_REGISTRY[ValidationRuleKind.Custom](base, node),
      })
    );
  }
}

/**
 * First-Class Route Validation Rule Entry (Ordered & Guaranteed Complete Model).
 * Pure JSON-serializable AST node: 0 loose strings, 0 split('|'), 0 typeof checks in downstream.
 */
export type ValidationFieldLocation =
  | { readonly kind: 'root' }
  | {
      readonly kind: 'collection_element';
      readonly collection: PropertyName;
      readonly path: readonly PropertyName[];
    };

export type ValidationFieldShape =
  | { readonly kind: 'scalar' }
  | {
      readonly kind: 'object';
      readonly fields: readonly ValidationFieldProperty[];
    }
  | {
      readonly kind: 'collection';
      readonly elementType: SemanticType;
      readonly element: ValidationFieldShape;
    };

export interface ValidationFieldProperty {
  readonly name: PropertyName;
  readonly semanticType: SemanticType;
  readonly presence: import('./requestFieldPresence').RequestFieldPresence;
  readonly validation: readonly ValidationRuleNode[];
  readonly shape: ValidationFieldShape;
  readonly source: SourceSpan;
}

export interface RouteValidationRuleEntry {
  /** Canonical field identity used by all consumers. */
  readonly fieldName: PropertyName;
  /** Exact Laravel field expression retained as source provenance. */
  readonly sourceField: PropertyName;
  /** Semantic location; wildcard syntax is not a downstream classification signal. */
  readonly location: ValidationFieldLocation;
  /** Complete shape facts resolved at the scanner origin boundary. */
  readonly shape: ValidationFieldShape;
  /** Semantic type resolved once at the scanner origin boundary. */
  readonly semanticType: SemanticType;
  /** Presence resolved once at the scanner origin boundary. */
  readonly presence: import('./requestFieldPresence').RequestFieldPresence;
  /** Original parsed rules retained as constraint/provenance data only. */
  readonly validation: readonly ValidationRuleNode[];
}

/**
 * First-Class Route Custom Error Message Entry.
 */
export interface RouteMessageEntry {
  readonly ruleKey: string;
  readonly message: string;
}

/**
 * First-Class Route Custom Attribute Name Entry.
 */
export interface RouteAttributeEntry {
  readonly fieldName: PropertyName;
  readonly label: string;
}

/**
 * Pure Ordered Validation Schema Payload (0 Record, 0 Object.entries).
 */
export interface RouteSchemaPayload {
  /** Canonical semantic request fields. Validation belongs to each field. */
  readonly fields: readonly RequestField[];
  readonly messages: readonly RouteMessageEntry[];
  readonly attributes: readonly RouteAttributeEntry[];
}

export const emptyRouteSchemaPayload = (): RouteSchemaPayload => Object.freeze({ fields: Object.freeze([]), messages: Object.freeze([]), attributes: Object.freeze([]) });
export const createRouteSchemaPayload = (fields: readonly RequestField[], messages: readonly RouteMessageEntry[] = [], attributes: readonly RouteAttributeEntry[] = []): RouteSchemaPayload => Object.freeze({ fields: Object.freeze([...fields]), messages: Object.freeze([...messages]), attributes: Object.freeze([...attributes]) });
