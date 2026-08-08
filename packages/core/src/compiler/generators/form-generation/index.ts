/**
 * Form Generation Module
 * 
 * SoC Architecture - Small focused classes
 * 
 * Components:
 * - FormFieldMapper: validation rules → TypeScript types
 * - FormActionGenerator: fields → action blocks
 * - FormCodeBuilder: action blocks → complete code
 * 
 * @module compiler/generators/form-generation
 */

export { FormFieldMapper } from './FormFieldMapper';
export { FormActionGenerator } from './FormActionGenerator';
export { FormCodeBuilder } from './FormCodeBuilder';

export type { ValidationRule, MappedField } from './FormFieldMapper';
export type { GeneratedAction } from './FormActionGenerator';
export type { BuiltCode } from './FormCodeBuilder';
