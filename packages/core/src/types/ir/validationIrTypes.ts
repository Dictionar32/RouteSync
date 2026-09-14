/**
 * validationIrTypes.ts
 *
 * Validation IR schemas for Zod, Laravel validation, and custom handlers.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/validationIrTypes
 */

export interface ZodValidationIR {
    readonly schema: string;
    readonly imports: readonly string[];
}

export interface LaravelValidationIRContract {
    readonly rules: Readonly<Record<string, readonly string[]>>;
    readonly ruleEntries?: readonly (readonly [string, readonly string[]])[];
    readonly messages: Readonly<Record<string, string>>;
    readonly messageEntries?: readonly (readonly [string, string])[];
}

export type LaravelValidationIR = {
    rules: Record<string, string[]>;
    ruleEntries?: readonly (readonly [string, readonly string[]])[];
    messages?: Record<string, string>;
    messageEntries?: readonly (readonly [string, string])[];
};

export interface CustomValidationIR {
    readonly name: string;
    readonly implementation: string;
    readonly dependencies: readonly string[];
}
