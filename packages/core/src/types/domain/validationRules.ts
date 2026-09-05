/**
 * ValidationRuleKind
 *
 * Canonical Domain Vocabulary for Laravel Validation Rules.
 */
export const ValidationRuleKind = Object.freeze({
  Required: 'required',
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

export interface ArrayValidationRuleNode extends BaseValidationRuleNode<'array'> {
  readonly kind: 'array';
  readonly elementType: string | null;
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

export interface DateValidationRuleNode extends BaseValidationRuleNode<'date'> {
  readonly kind: 'date';
  readonly format: string | null;
}

export interface MinValidationRuleNode extends BaseValidationRuleNode<'min'> {
  readonly kind: 'min';
  readonly value: number;
}

export interface MaxValidationRuleNode extends BaseValidationRuleNode<'max'> {
  readonly kind: 'max';
  readonly value: number;
}

export interface BetweenValidationRuleNode extends BaseValidationRuleNode<'between'> {
  readonly kind: 'between';
  readonly min: number;
  readonly max: number;
}

export interface InValidationRuleNode extends BaseValidationRuleNode<'in'> {
  readonly kind: 'in';
  readonly values: readonly (string | number)[];
}

export interface ExistsValidationRuleNode extends BaseValidationRuleNode<'exists'> {
  readonly kind: 'exists';
  readonly table: string;
  readonly column: string | null;
}

export interface UniqueValidationRuleNode extends BaseValidationRuleNode<'unique'> {
  readonly kind: 'unique';
  readonly table: string;
  readonly column: string | null;
}

export interface FileValidationRuleNode extends BaseValidationRuleNode<'file'> {
  readonly kind: 'file';
}

export interface ImageValidationRuleNode extends BaseValidationRuleNode<'image'> {
  readonly kind: 'image';
}

export interface CustomValidationRuleNode extends BaseValidationRuleNode<'custom'> {
  readonly kind: 'custom';
  readonly rule: string;
  readonly parameters: readonly string[];
}

export type ValidationRuleNode =
  | RequiredValidationRuleNode
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
  readonly isTypeAssertion: boolean;
  readonly isConstraint: boolean;
  readonly isModifier: boolean;
  readonly description: string;
}

export type ValidationRuleRegistry = {
  readonly [K in ValidationRuleKind]: ValidationRuleSpecification<K>;
};

export const VALIDATION_RULE_REGISTRY: ValidationRuleRegistry = Object.freeze({
  [ValidationRuleKind.Required]: {
    kind: ValidationRuleKind.Required,
    category: 'modifier',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: true,
    description: 'Field must be present and not empty'
  },
  [ValidationRuleKind.Nullable]: {
    kind: ValidationRuleKind.Nullable,
    category: 'modifier',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: true,
    description: 'Field may be null'
  },
  [ValidationRuleKind.Optional]: {
    kind: ValidationRuleKind.Optional,
    category: 'modifier',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: true,
    description: 'Field may be omitted/sometimes'
  },
  [ValidationRuleKind.String]: {
    kind: ValidationRuleKind.String,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be a string'
  },
  [ValidationRuleKind.Number]: {
    kind: ValidationRuleKind.Number,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be numeric'
  },
  [ValidationRuleKind.Boolean]: {
    kind: ValidationRuleKind.Boolean,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be a boolean'
  },
  [ValidationRuleKind.Array]: {
    kind: ValidationRuleKind.Array,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be an array'
  },
  [ValidationRuleKind.Email]: {
    kind: ValidationRuleKind.Email,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be formatted as an e-mail address'
  },
  [ValidationRuleKind.Url]: {
    kind: ValidationRuleKind.Url,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be formatted as a valid URL'
  },
  [ValidationRuleKind.Uuid]: {
    kind: ValidationRuleKind.Uuid,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be a valid UUID'
  },
  [ValidationRuleKind.Date]: {
    kind: ValidationRuleKind.Date,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be a valid date'
  },
  [ValidationRuleKind.Min]: {
    kind: ValidationRuleKind.Min,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must have minimum value or length'
  },
  [ValidationRuleKind.Max]: {
    kind: ValidationRuleKind.Max,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must have maximum value or length'
  },
  [ValidationRuleKind.Between]: {
    kind: ValidationRuleKind.Between,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be between min and max values'
  },
  [ValidationRuleKind.In]: {
    kind: ValidationRuleKind.In,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be included in given list of values'
  },
  [ValidationRuleKind.Exists]: {
    kind: ValidationRuleKind.Exists,
    category: 'database',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must exist in specified database table'
  },
  [ValidationRuleKind.Unique]: {
    kind: ValidationRuleKind.Unique,
    category: 'database',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be unique in specified database table'
  },
  [ValidationRuleKind.File]: {
    kind: ValidationRuleKind.File,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be an uploaded file'
  },
  [ValidationRuleKind.Image]: {
    kind: ValidationRuleKind.Image,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be an uploaded image file'
  },
  [ValidationRuleKind.Custom]: {
    kind: ValidationRuleKind.Custom,
    category: 'custom',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: false,
    description: 'Custom or unhandled Laravel validation rule'
  }
});

export type ValidationRuleVisitor<R> = {
  readonly required: (rule: RequiredValidationRuleNode) => R;
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
  return visitor[rule.kind](rule as any);
}

export const matchRule = matchValidationRule;

/**
 * ValidationRuleNodeFactory
 *
 * Canonical Reusable Factory for Structured ValidationRuleNode AST.
 */
export class ValidationRuleNodeFactory {
  public static required(): RequiredValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Required });
  }
  public static nullable(): NullableValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Nullable });
  }
  public static optional(): OptionalValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Optional });
  }
  public static string(): StringValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.String });
  }
  public static number(): NumberValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Number });
  }
  public static boolean(): BooleanValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Boolean });
  }
  public static array(elementType: string | null = null): ArrayValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Array, elementType });
  }
  public static email(): EmailValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Email });
  }
  public static url(): UrlValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Url });
  }
  public static uuid(): UuidValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Uuid });
  }
  public static date(format: string | null = null): DateValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Date, format });
  }
  public static min(value: number): MinValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Min, value });
  }
  public static max(value: number): MaxValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Max, value });
  }
  public static between(min: number, max: number): BetweenValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Between, min, max });
  }
  public static in(values: readonly (string | number)[]): InValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.In, values: Object.freeze([...values]) });
  }
  public static exists(table: string, column: string | null = null): ExistsValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Exists, table, column });
  }
  public static unique(table: string, column: string | null = null): UniqueValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Unique, table, column });
  }
  public static file(): FileValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.File });
  }
  public static image(): ImageValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Image });
  }
  public static custom(rule: string, parameters: readonly string[] = []): CustomValidationRuleNode {
    return Object.freeze({ kind: ValidationRuleKind.Custom, rule, parameters: Object.freeze([...parameters]) });
  }
}

/**
 * ValidationRuleParser
 *
 * Pure Deterministic AST Parser for Laravel Validation Rule Strings.
 * Transforms raw Laravel rule strings into strongly-typed ValidationRuleNode AST.
 */
export class ValidationRuleParser {
  public static parse(ruleStr: string): ValidationRuleNode {
    const trimmed = (ruleStr || '').trim();
    const colonIdx = trimmed.indexOf(':');
    const name = (colonIdx === -1 ? trimmed : trimmed.slice(0, colonIdx)).toLowerCase();
    const paramStr = colonIdx === -1 ? '' : trimmed.slice(colonIdx + 1);
    const params = paramStr ? paramStr.split(',').map(s => s.trim()) : [];

    switch (name) {
      case 'required':
        return ValidationRuleNodeFactory.required();
      case 'nullable':
        return ValidationRuleNodeFactory.nullable();
      case 'sometimes':
      case 'optional':
        return ValidationRuleNodeFactory.optional();
      case 'string':
        return ValidationRuleNodeFactory.string();
      case 'integer':
      case 'int':
      case 'numeric':
      case 'digits':
        return ValidationRuleNodeFactory.number();
      case 'boolean':
      case 'bool':
        return ValidationRuleNodeFactory.boolean();
      case 'array':
        return ValidationRuleNodeFactory.array();
      case 'email':
        return ValidationRuleNodeFactory.email();
      case 'url':
        return ValidationRuleNodeFactory.url();
      case 'uuid':
        return ValidationRuleNodeFactory.uuid();
      case 'date':
      case 'datetime':
      case 'timestamp':
        return ValidationRuleNodeFactory.date(params[0] ?? null);
      case 'min':
        return ValidationRuleNodeFactory.min(Number(params[0]) || 0);
      case 'max':
        return ValidationRuleNodeFactory.max(Number(params[0]) || 0);
      case 'between':
        return ValidationRuleNodeFactory.between(Number(params[0]) || 0, Number(params[1]) || 0);
      case 'in':
        return ValidationRuleNodeFactory.in(params);
      case 'exists':
        return ValidationRuleNodeFactory.exists(params[0] || '', params[1] ?? null);
      case 'unique':
        return ValidationRuleNodeFactory.unique(params[0] || '', params[1] ?? null);
      case 'file':
        return ValidationRuleNodeFactory.file();
      case 'image':
        return ValidationRuleNodeFactory.image();
      default: {
        // Fluent Laravel Rules: Rule::in([...]), Rule::unique('table', 'col'), Rule::exists('table', 'col')
        if (trimmed.includes('Rule::in') || trimmed.startsWith('in(')) {
          const match = trimmed.match(/(?:Rule::in|in)\s*\(\s*\[?([^\]\)]*)\]?\s*\)/);
          if (match && match[1]) {
            const values = match[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
            return ValidationRuleNodeFactory.in(values);
          }
        }
        if (trimmed.includes('Rule::unique') || trimmed.startsWith('unique(')) {
          const match = trimmed.match(/(?:Rule::unique|unique)\s*\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
          if (match && match[1]) {
            return ValidationRuleNodeFactory.unique(match[1], match[2] ?? null);
          }
        }
        if (trimmed.includes('Rule::exists') || trimmed.startsWith('exists(')) {
          const match = trimmed.match(/(?:Rule::exists|exists)\s*\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
          if (match && match[1]) {
            return ValidationRuleNodeFactory.exists(match[1], match[2] ?? null);
          }
        }
        return ValidationRuleNodeFactory.custom(name, params);
      }
    }
  }

  public static parseAll(rules: readonly (string | ValidationRuleNode)[]): readonly ValidationRuleNode[] {
    return Object.freeze(
      rules.map(r => typeof r === 'string' ? this.parse(r) : r)
    );
  }

  /**
   * Directly lowers ValidationRuleNode AST to Zod schema string expression.
   * Pure deterministic compiler method (0 regex, 0 string matching, 0 if).
   */
  public static toZodExpression(rules: readonly ValidationRuleNode[]): string {
    const isRequired = rules.some(r => r.kind === ValidationRuleKind.Required);
    const hasOptional = rules.some(r => r.kind === ValidationRuleKind.Optional);
    const initialNode: ZodNode = { expression: 'z.string()' };
    let finalNode = ZodSchemaReducer.reduceConstraints(initialNode, rules);
    if (!isRequired && !hasOptional) {
      finalNode = { expression: `${finalNode.expression}.optional()` };
    }
    return finalNode.expression;
  }
}

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
    expression: `z.enum([${c.values.map(v => JSON.stringify(v)).join(', ')}])`
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
  [ValidationRuleKind.Exists]: (base) => base,
  [ValidationRuleKind.Unique]: (base) => base,
  [ValidationRuleKind.Custom]: (base) => base
});

export class ZodSchemaReducer {
  public static reduceConstraints(
    initialNode: ZodNode,
    constraints: readonly ValidationRuleNode[]
  ): ZodNode {
    return constraints.reduce<ZodNode>((base, constraint) => {
      const handler = ZOD_CONSTRAINT_REGISTRY[constraint.kind] as (
        b: ZodNode,
        c: ValidationRuleNode
      ) => ZodNode;
      return handler(base, constraint);
    }, initialNode);
  }
}

/**
 * First-Class Route Validation Rule Entry (Ordered & Guaranteed Complete Model).
 * Pure JSON-serializable AST node: 0 loose strings, 0 split('|'), 0 typeof checks in downstream.
 */
export interface RouteValidationRuleEntry {
  readonly fieldName: string;
  readonly propertyName: string;
  readonly ast: readonly ValidationRuleNode[];
  readonly rules: readonly string[];
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
  readonly fieldName: string;
  readonly label: string;
}

/**
 * Pure Ordered Validation Schema Payload (0 Record, 0 Object.entries).
 */
export interface RouteSchemaPayload {
  readonly rules: readonly RouteValidationRuleEntry[];
  readonly messages: readonly RouteMessageEntry[];
  readonly attributes: readonly RouteAttributeEntry[];
}
