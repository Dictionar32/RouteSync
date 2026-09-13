/**
 * contractArtifactBuilder.ts
 *
 * Source code formatting and GeneratedContractArtifact construction with compiler fingerprints.
 *
 * @module compiler/passes/contract-domain/contractArtifactBuilder
 */

import type { GeneratedContractArtifact, GeneratedContractInfo } from '../../artifacts/GeneratedContractArtifact';
import { toPascalCase } from '../../../utils/resource-naming';
import { computeFingerprintHash, type CompilerFingerprint } from '../../fingerprint/Fingerprint';
import type {
    ResourceContractCollection,
    ActionResponseSchemaCollection,
    ContractCodeBuilderLike,
    GeneratedContractCode
} from './contractTypes';
import { EMPTY_WARNINGS } from './contractTypes';

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Stage 3: Format contracts into TypeScript Zod source code */
export function formatContractFile(
    contracts: ResourceContractCollection,
    responseSchemas: ActionResponseSchemaCollection,
    codeBuilder: ContractCodeBuilderLike
): GeneratedContractCode {
    const rawContracts = contracts.fields.map(c => ({
        resourceName: c.resourceName,
        actions: c.actions
    }));
    const rawSchemas = responseSchemas.fields;

    return codeBuilder.buildContractFile(rawContracts, rawSchemas);
}

/** Stage 4: Build artifact with metadata */
export function buildContractArtifact(
    builtCode: GeneratedContractCode,
    contracts: ResourceContractCollection,
    responseSchemas: ActionResponseSchemaCollection,
    producerName: string,
    warnings: readonly string[] = EMPTY_WARNINGS
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
            zodSchema: (a as any).schemaLines ? (a as any).schemaLines.join('\n') : ((a as any).schemaCode ?? ''),
            validatorName: `validate${toPascalCase(contract.resourceName)}${capitalize(a.name)}`,
            fieldCount: (a as any).fieldCount ?? 0
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
