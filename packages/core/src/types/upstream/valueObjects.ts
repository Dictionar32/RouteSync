import type { Sequence } from './collections';
export interface StringValue { readonly kind: 'string_value'; readonly value: string }
export interface NumberValue { readonly kind: 'number_value'; readonly value: number }
export interface HttpStatusCode { readonly kind: 'http_status_code'; readonly value: NumberValue }
export interface TruthValue { readonly kind: 'truth_value'; readonly value: boolean }
export interface StringValues { readonly kind: 'string_values'; readonly items: Sequence<StringValue> }

export interface DescriptionText { readonly kind: 'description_text'; readonly value: string }
export interface GeneratorName { readonly kind: 'generator_name'; readonly value: string }
export interface GenerationTimestamp { readonly kind: 'generation_timestamp'; readonly value: string }
