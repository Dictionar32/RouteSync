export interface StringValue {
  readonly kind: 'string_value';
  readonly value: string;
}

export const stringValue = (value: string): StringValue =>
  Object.freeze({ kind: 'string_value' as const, value });
