/** Closed validation projection. No rule strings or optional parallel bags. */

import type { ValidationRules } from '../upstream/collections';
import type { StringValue } from '../upstream/valueObjects';
import type { PropertyName, CodeExpression } from './nominalVocabulary';

export interface ZodValidationIR {
    readonly schema: CodeExpression;
    readonly imports: readonly CodeExpression[];
}

export interface LaravelValidationIRContract {
    readonly rules: ValidationRules;
    readonly messages: ReadonlyMap<PropertyName, StringValue>;
}

export type LaravelValidationIR = LaravelValidationIRContract;

export interface CustomValidationIR {
    readonly name: CodeExpression;
    readonly implementation: CodeExpression;
    readonly dependencies: readonly CodeExpression[];
}
