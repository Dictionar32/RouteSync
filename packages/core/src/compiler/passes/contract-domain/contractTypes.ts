/**
 * contractTypes.ts
 *
 * Types, collections, and capability interfaces for contract generator domain.
 *
 * @module compiler/passes/contract-domain/contractTypes
 */

import type { FileValidationConstraints } from '../../artifacts/RequestTypesArtifact';
import type { GeneratedContractAction } from '../../generators/contract-generation/ContractActionGenerator';
import type { ContractSchemaMapper } from '../../generators/contract-generation/ContractSchemaMapper';
import type { ActionResponseSchema } from '../../generators/contract-generation/ResponseActionBuilder';
import type { ParsedResponseField } from '../../generators/contract-generation/ResponseFieldParser';
import type { SemanticType } from '../../types/SemanticType';
import type { FieldCollection } from '../../domain/common/FieldCollection';
import { ConversionResult } from '../../domain/common/ConversionResult';

export interface ContractField {
    readonly name: string;
    readonly type: SemanticType;
    readonly fileConstraints?: FileValidationConstraints;
    readonly required: boolean;
    readonly nullable: boolean;
}

export interface ContractActionGeneratorLike {
    generateAction(
        actionName: string,
        fields: readonly ContractField[],
        contractSchemaName?: string
    ): GeneratedContractAction;
}

export interface ContractCodeBuilderLike {
    buildContractFile(
        contracts: readonly { readonly resourceName: string; readonly actions: readonly GeneratedContractAction[] }[],
        responseSchemas: readonly ActionResponseSchema[]
    ): GeneratedContractCode;
}

export interface ResponseActionBuilderLike {
    buildShowSchema(resourceName: string, fields: readonly ParsedResponseField[]): ActionResponseSchema;
    buildIndexSchema(resourceName: string, showSchemaName: string): ActionResponseSchema;
}

export interface ContractGeneratorDependencies {
    readonly schemaMapper: ContractSchemaMapper;
    readonly actionGenerator: ContractActionGeneratorLike;
    readonly codeBuilder: ContractCodeBuilderLike;
    readonly responseActionBuilder: ResponseActionBuilderLike;
}

export interface ResourceContract {
    readonly resourceName: string;
    readonly actions: readonly GeneratedContractAction[];
}

export type ResourceContractCollection = FieldCollection<ResourceContract>;
export type ActionResponseSchemaCollection = FieldCollection<ActionResponseSchema>;

export interface GeneratedContractCode {
    readonly code: string;
    readonly contractCount: number;
    readonly lineCount: number;
}

export { ConversionResult };
export const EMPTY_WARNINGS = ConversionResult.EMPTY_WARNINGS;
export const EMPTY_FIELDS = ConversionResult.EMPTY_FIELDS;

export type StageResult<T> = ConversionResult<T>;

export type NullableWrapperResult =
    | { readonly isNullableWrapper: true; readonly field: ParsedResponseField; readonly warnings: readonly string[] }
    | { readonly isNullableWrapper: false };

export type ResponseFieldConversionResult = ConversionResult<ParsedResponseField>;
export type ResourceResponseSchemasResult = ConversionResult<ActionResponseSchema>;

export interface ExtractedResponseSchemaResult {
    readonly fields: ActionResponseSchemaCollection;
    readonly warnings: readonly string[];
}
