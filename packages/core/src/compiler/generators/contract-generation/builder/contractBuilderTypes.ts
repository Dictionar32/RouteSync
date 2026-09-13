/**
 * contractBuilderTypes.ts
 *
 * Types and interfaces for assembling api-contract.ts code.
 *
 * @module compiler/generators/contract-generation/builder/contractBuilderTypes
 */

import type { GeneratedContractAction } from '../ContractActionGenerator';

/**
 * Input: Generated contract with actions
 */
export interface GeneratedContract {
    readonly resourceName: string;
    readonly actions: readonly GeneratedContractAction[];
}

/**
 * Response schema for show/index actions
 */
export interface ResponseSchema {
    readonly schemaName: string;
    readonly zodSchema: string;
    readonly action: 'show' | 'index';
    readonly resourceName: string;
}

/**
 * Section metadata for tracking line ranges
 */
export interface SectionInfo {
    readonly name: string;
    readonly startLine: number;
    readonly endLine: number;
}

/**
 * Output: Complete contract file
 */
export interface BuiltContractCode {
    readonly code: string;
    readonly lineCount: number;
    readonly contractCount: number;
    readonly sections: readonly SectionInfo[];
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
