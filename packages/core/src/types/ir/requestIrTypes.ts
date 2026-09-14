/**
 * requestIrTypes.ts
 *
 * Request domain IR interfaces, action specifications, and validation rules.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/requestIrTypes
 */

import type { ResourceFieldIR } from './resourceIrTypes';
import type { ZodValidationIR, LaravelValidationIR, CustomValidationIR } from './validationIrTypes';

export interface ValidationRules {
    readonly type: 'required' | 'optional' | 'nullable' | 'array' | 'object' | 'custom';
    readonly rule?: string;
    readonly message?: string;
}

export interface ValidationSchemas {
    readonly zod?: ZodValidationIR;
    readonly laravel?: LaravelValidationIR;
    readonly custom?: readonly CustomValidationIR[];
}

export interface RequestActionIR {
    readonly name: 'Create' | 'Update' | 'Delete' | 'Custom';
    readonly customName?: string;
    readonly fields: readonly ResourceFieldIR[];
    readonly rules: readonly ValidationRules[];
    readonly dependencies?: readonly string[];
}

export interface RequestMetadata {
    readonly sourceFile: string;
    readonly controller?: string;
    readonly routes: readonly string[];
    readonly generated_at: string;
}

export interface RequestIR {
    readonly id: string;
    readonly name: string;
    readonly actions: readonly RequestActionIR[];
    readonly validation: ValidationSchemas;
    readonly metadata: RequestMetadata;
}
