export interface StringValue {
  readonly kind: 'string_value';
  readonly value: string;
}

export interface StringValueFactoryInterface {
  readonly create: (sourceText: string) => StringValue;
}

export const stringValue: StringValueFactoryInterface = Object.freeze({
  create: (sourceText: string): StringValue =>
    Object.freeze({ kind: 'string_value' as const, value: sourceText }),
});

export interface NumberValue {
  readonly kind: 'number_value';
  readonly value: number;
}

export const numberValue = (value: number): NumberValue =>
  Object.freeze({ kind: 'number_value' as const, value });

export interface TruthValue {
  readonly kind: 'truth_value';
  readonly value: boolean;
}

export const truthValue = (value: boolean): TruthValue =>
  Object.freeze({ kind: 'truth_value' as const, value });

export interface StringValues {
  readonly kind: 'string_values';
  readonly items: readonly StringValue[];
}

export interface DescriptionText {
  readonly kind: 'description_text';
  readonly value: string;
}

export interface DescriptionTextFactoryInterface {
  readonly create: (sourceText: StringValue) => DescriptionText;
}

export const descriptionText: DescriptionTextFactoryInterface = Object.freeze({
  create: (sourceText: StringValue): DescriptionText =>
    Object.freeze({ kind: 'description_text' as const, value: sourceText.value }),
});

export interface HttpStatusCode {
  readonly kind: 'http_status_code';
  readonly value: NumberValue;
}

/** A position in the ordered statement stream. The ordinal is retained as boundary evidence; consumers advance and compare through statementIndexOperations. */
export interface StatementIndex {
  readonly kind: 'statement_index';
  readonly ordinal: NumberValue;
}

export type StatementIndexOrder =
  | { readonly kind: 'same_statement_index' }
  | { readonly kind: 'earlier_statement_index' }
  | { readonly kind: 'later_statement_index' };

export interface StatementIndexOperationsInterface {
  readonly first: StatementIndex;
  readonly successor: (current: StatementIndex) => StatementIndex;
  readonly compare: (left: StatementIndex, right: StatementIndex) => StatementIndexOrder;
  readonly same: (left: StatementIndex, right: StatementIndex) => boolean;
}

/** Domain-owned sequence operations; callers no longer maintain statement ordinals with local numeric arithmetic. */
export const statementIndexOperations: StatementIndexOperationsInterface = Object.freeze({
  first: Object.freeze({ kind: 'statement_index' as const, ordinal: numberValue(0) }),
  successor: (current: StatementIndex): StatementIndex => Object.freeze({
    kind: 'statement_index' as const,
    ordinal: numberValue(current.ordinal.value + 1),
  }),
  compare: (left: StatementIndex, right: StatementIndex): StatementIndexOrder => {
    if (left.ordinal.value === right.ordinal.value) return Object.freeze({ kind: 'same_statement_index' as const });
    if (left.ordinal.value < right.ordinal.value) return Object.freeze({ kind: 'earlier_statement_index' as const });
    return Object.freeze({ kind: 'later_statement_index' as const });
  },
  same: (left: StatementIndex, right: StatementIndex): boolean => left.ordinal.value === right.ordinal.value,
});

export type StatementPath = {
  readonly kind: 'statement_path';
  readonly items: readonly StatementIndex[];
};

export interface GeneratorName {
  readonly kind: 'generator_name';
  readonly value: StringValue;
}

export interface GenerationTimestamp {
  readonly kind: 'generation_timestamp';
  readonly value: StringValue;
}
