export interface StringValue {
  readonly kind: 'string_value';
  readonly value: string;
}

export const stringValue = (value: string): StringValue =>
  Object.freeze({ kind: 'string_value' as const, value });

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

export interface StringValues {
  readonly kind: 'string_values';
  readonly items: readonly StringValue[];
}

export interface DescriptionText {
  readonly kind: 'description_text';
  readonly value: string;
}

export interface HttpStatusCode {
  readonly kind: 'http_status_code';
  readonly value: NumberValue;
}

export type StatementIndex = NumberValue;
export type StatementPath = {
  readonly kind: 'statement_path';
  readonly items: readonly NumberValue[];
};

export interface GeneratorName {
  readonly kind: 'generator_name';
  readonly value: StringValue;
}

export interface GenerationTimestamp {
  readonly kind: 'generation_timestamp';
  readonly value: StringValue;
}
