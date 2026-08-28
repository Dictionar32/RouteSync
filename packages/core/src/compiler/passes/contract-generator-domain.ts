/**
 * contract-generator-domain.ts
 *
 * Flow-Based Type Design & Pure Operations module for ContractGeneratorPass.
 *
 * Pipeline Architecture:
 *
 *                     ORIGIN BOUNDARY
 *          createContractGeneratorDependencies()
 *                         │
 *                         ▼
 *         ContractGeneratorDependencies (Complete Contract)
 *                         │
 *                         ▼
 *               ContractGeneratorPass
 *                         │
 *      ┌──────────────────┼──────────────────┐
 *      ▼                  ▼                  ▼
 *  extractRequest  extractResponse     formatContract
 *   Contracts          Schemas              File
 *      └──────────────────┬──────────────────┘
 *                         ▼
 *               buildContractArtifact
 *
 * @module compiler/passes
 */

import type { FileValidationConstraints, RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';
import type { GeneratedContractArtifact, GeneratedContractInfo } from '../artifacts/GeneratedContractArtifact';
import type { FieldCollection } from '../domain/common/FieldCollection';
import type { GeneratedContractAction } from '../generators/contract-generation/ContractActionGenerator';
import { ContractActionGenerator } from '../generators/contract-generation/ContractActionGenerator';
import { ContractSchemaMapper } from '../generators/contract-generation/ContractSchemaMapper';
import { ContractCodeBuilder } from '../generators/contract-generation/ContractCodeBuilder';
import { ResponseActionBuilder, type ActionResponseSchema } from '../generators/contract-generation/ResponseActionBuilder';
import { ResponseSchemaMapper } from '../generators/contract-generation/ResponseSchemaMapper';
import type { ParsedResponseField } from '../generators/contract-generation/ResponseFieldParser';
import type { SemanticType } from '../types/SemanticType';
import { toPascalCase } from '../../utils/resource-naming';
import { computeFingerprintHash, type CompilerFingerprint } from '../fingerprint/Fingerprint';

// ============================================================================
// 1. CAPABILITY INTERFACES & COMPLETE CONTRACT ORIGIN
// ============================================================================

export interface ContractActionGeneratorLike {
    generateAction(
        actionName: string,
        fields: readonly {
            readonly name: string;
            readonly type: SemanticType;
            readonly fileConstraints?: FileValidationConstraints;
            readonly required: boolean;
            readonly nullable: boolean;
        }[]
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

/**
 * Complete Contract for ContractGeneratorPass dependencies (100% required)
 */
export interface ContractGeneratorDependencies {
    readonly schemaMapper: ContractSchemaMapper;
    readonly actionGenerator: ContractActionGeneratorLike;
    readonly codeBuilder: ContractCodeBuilderLike;
    readonly responseActionBuilder: ResponseActionBuilderLike;
}

/**
 * Dependency Origin Boundary: Resolves optional configuration into a Complete Contract.
 * Utilizes ES6 Destructuring Defaults (=) left-to-right (0% ??, 0% ?.).
 */
export function createContractGeneratorDependencies({
    schemaMapper = new ContractSchemaMapper(),
    actionGenerator = new ContractActionGenerator(schemaMapper),
    codeBuilder = new ContractCodeBuilder(),
    responseActionBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
}: Partial<ContractGeneratorDependencies> = {}): ContractGeneratorDependencies {
    return {
        schemaMapper,
        actionGenerator,
        codeBuilder,
        responseActionBuilder
    };
}

// ============================================================================
// 2. DOMAIN TYPE VOCABULARY & CONVERSION RESULTS
// ============================================================================

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

/** Observable result container for response field conversion */
export interface ResponseFieldConversionResult {
    readonly fields: readonly ParsedResponseField[];
    readonly warnings: readonly string[];
}

/** Observable result container for response schema extraction stage */
export interface ExtractedResponseSchemaResult {
    readonly fields: ActionResponseSchemaCollection;
    readonly warnings: readonly string[];
}

// ============================================================================
// 3. PURE STAGE OPERATIONS (PURE FLOW PIPELINE)
// ============================================================================

/** Stage 1: Extract request validation contracts */
export function extractRequestContracts(
    artifact: RequestTypesArtifact,
    actionGenerator: ContractActionGeneratorLike
): ResourceContractCollection {
    const requestTypes = artifact.requestTypes;
    const resourceContracts: ResourceContract[] = [];

    for (const requestType of requestTypes) {
        const actions: GeneratedContractAction[] = [];

        for (const action of requestType.actions || []) {
            const contractFields = (action.fields || []).map(field => ({
                name: field.originalName,
                type: field.type,
                fileConstraints: field.fileConstraints,
                required: field.required,
                nullable: field.nullable
            }));

            const generated = actionGenerator.generateAction(action.name, contractFields);
            actions.push(generated);
        }

        resourceContracts.push({
            resourceName: requestType.resourceName,
            actions
        });
    }

    return { fields: resourceContracts };
}

/** Stage 2: Extract response schemas with observable warnings (no silent catch) */
export function extractResponseSchemas(
    artifact: RequestTypesArtifact,
    responseActionBuilder: ResponseActionBuilderLike
): ExtractedResponseSchemaResult {
    const requestTypes = artifact.requestTypes;
    const responseSchemas: ActionResponseSchema[] = [];
    const warnings: string[] = [];

    for (const requestType of requestTypes) {
        if (!requestType.responseData) {
            continue;
        }

        const { resourceName, fields } = requestType.responseData;
        const conversionResult = convertResponseFields(fields);

        if (conversionResult.warnings.length > 0) {
            warnings.push(...conversionResult.warnings);
        }

        try {
            const showSchema = responseActionBuilder.buildShowSchema(resourceName, conversionResult.fields);
            responseSchemas.push(showSchema);

            const indexSchema = responseActionBuilder.buildIndexSchema(resourceName, showSchema.schemaName);
            responseSchemas.push(indexSchema);
        } catch (error) {
            warnings.push(
                `Failed to build response schema for ${resourceName}: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    return {
        fields: { fields: responseSchemas },
        warnings
    };
}

const SUPPORTED_SEMANTIC_KINDS = new Set([
    'primitive',
    'object',
    'readonly_collection',
    'mutable_collection',
    'reference'
]);

/** Observable convertResponseFields without silent catch */
export function convertResponseFields(
    fields: Record<string, SemanticType>
): ResponseFieldConversionResult {
    const resultFields: ParsedResponseField[] = [];
    const warnings: string[] = [];

    for (const [fieldName, semanticType] of Object.entries(fields)) {
        if (
            !semanticType ||
            typeof semanticType !== 'object' ||
            !('kind' in semanticType) ||
            !SUPPORTED_SEMANTIC_KINDS.has((semanticType).kind)
        ) {
            warnings.push(`Skipped field '${fieldName}': unsupported or missing SemanticType kind '${(semanticType).kind}'`);
            continue;
        }

        try {
            const parsed = convertSingleResponseField(fieldName, semanticType);
            resultFields.push(parsed);
        } catch (error) {
            warnings.push(
                `Skipped field '${fieldName}': ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    return {
        fields: resultFields,
        warnings
    };
}

/** Pattern matching on SemanticType.kind */
export function convertSingleResponseField(
    fieldName: string,
    semanticType: SemanticType
): ParsedResponseField {
    if (
        semanticType.kind === 'object' &&
        semanticType.annotations?.get('kind') === 'nullable_wrapper'
    ) {
        const inner = semanticType.properties.get('__value');
        if (inner) {
            return {
                ...convertSingleResponseField(fieldName, inner),
                nullable: true
            };
        }
    }

    if (semanticType.kind === 'primitive') {
        return {
            name: fieldName,
            kind: 'primitive',
            type: semanticType.type,
            nullable: false,
            optional: false
        };
    }

    if (semanticType.kind === 'object') {
        const nestedFields: ParsedResponseField[] = [];
        if (semanticType.properties) {
            for (const [propName, propType] of Array.from(semanticType.properties.entries())) {
                nestedFields.push(convertSingleResponseField(propName, propType));
            }
        }
        return {
            name: fieldName,
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: nestedFields
        };
    }

    if (semanticType.kind === 'readonly_collection' || semanticType.kind === 'mutable_collection') {
        return {
            name: fieldName,
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: convertSingleResponseField('item', semanticType.elementType)
        };
    }

    if (semanticType.kind === 'reference') {
        return {
            name: fieldName,
            kind: 'primitive',
            type: semanticType.name,
            nullable: false,
            optional: false
        };
    }

    return {
        name: fieldName,
        kind: 'primitive',
        type: 'unknown',
        nullable: false,
        optional: false
    };
}

/** Stage 3: Format contracts into TypeScript Zod source code */
export function formatContractFile(
    contracts: ResourceContractCollection,
    responseSchemas: ActionResponseSchemaCollection,
    codeBuilder: ContractCodeBuilderLike
): GeneratedContractCode {
    const rawContracts = contracts.fields.map(c => ({
        resourceName: c.resourceName,
        actions: [...c.actions]
    }));
    const rawSchemas = [...responseSchemas.fields];

    return codeBuilder.buildContractFile(rawContracts, rawSchemas);
}

/** Stage 4: Build artifact with metadata */
export function buildContractArtifact(
    builtCode: GeneratedContractCode,
    contracts: ResourceContractCollection,
    responseSchemas: ActionResponseSchemaCollection,
    producerName: string,
    warnings: readonly string[] = []
): GeneratedContractArtifact {
    const fingerprint: CompilerFingerprint = {
        compilerVersion: '1.0.0',
        parserVersion: '1.0.0',
        phpVersion: '8.2.0',
        frameworkVersion: '10.0.0',
        targetBackend: 'typescript',
        strictMode: false,
        featureFlags: new Map()
    };

    let totalActions = 0;
    for (const c of contracts.fields) {
        totalActions += c.actions.length;
    }

    const contractsInfo: GeneratedContractInfo[] = contracts.fields.map(contract => ({
        name: contract.resourceName,
        schemaName: `${contract.resourceName}ContractSchema`,
        actions: contract.actions.map(a => ({
            name: a.name,
            zodSchema: a.schemaLines.join('\n'),
            validatorName: `validate${toPascalCase(contract.resourceName)}${capitalize(a.name)}`,
            fieldCount: a.fieldCount
        })),
        lineRange: [0, 0] as const
    }));

    return {
        typeId: 'GeneratedContract',
        code: builtCode.code,
        contracts: contractsInfo,
        generationMetadata: {
            generatorVersion: '1.0.0',
            requestTypeCount: contractsInfo.length,
            contractCount: builtCode.contractCount,
            totalActions,
            zodSchemasCount: totalActions,
            validatorsCount: totalActions,
            linesOfCode: builtCode.lineCount,
            warnings
        },
        metadata: {
            hash: computeFingerprintHash(fingerprint),
            producer: producerName,
            dependencies: ['RequestTypes'],
            timestamp: Date.now(),
            revision: '1.0.0'
        }
    };
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
