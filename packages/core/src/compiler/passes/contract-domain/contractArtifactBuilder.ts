/**
 * Relation-oriented contract formatting and artifact construction.
 */
import type { GeneratedContractArtifact, GeneratedContractInfo } from '../../artifacts/GeneratedContractArtifact';
import { toPascalCase } from '../../../utils/resource-naming';
import { computeFingerprintHash, type CompilerFingerprint } from '../../fingerprint/Fingerprint';
import type {
    ResourceContractCollection,
    ActionResponseSchemaCollection,
    ContractCodeBuilderLike,
    GeneratedContractCode,
} from './contractTypes';
import { EMPTY_WARNINGS } from './contractTypes';
import { relationFold, relationProject } from '../../../semantic/foundation/relationalSequence';

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

export function formatContractFile(
    contracts: ResourceContractCollection,
    responseSchemas: ActionResponseSchemaCollection,
    codeBuilder: ContractCodeBuilderLike,
): GeneratedContractCode {
    const rawContracts = relationProject(contracts.fields, contract => ({
        resourceName: contract.resourceName,
        actions: contract.actions,
    }));
    return codeBuilder.buildContractFile(rawContracts, responseSchemas.fields);
}

export function buildContractArtifact(
    builtCode: GeneratedContractCode,
    contracts: ResourceContractCollection,
    responseSchemas: ActionResponseSchemaCollection,
    producerName: string,
    warnings: readonly string[] = EMPTY_WARNINGS,
): GeneratedContractArtifact {
    const fingerprint: CompilerFingerprint = {
        compilerVersion: '1.0.0',
        parserVersion: '1.0.0',
        phpVersion: '8.2.0',
        frameworkVersion: '10.0.0',
        targetBackend: 'typescript',
        strictMode: false,
        featureFlags: Object.freeze([]),
    };
    const totalActions = relationFold(
        contracts.fields,
        0,
        (total, contract) => total + contract.actions.length,
    );
    const contractsInfo: readonly GeneratedContractInfo[] = relationProject(
        contracts.fields,
        contract => ({
            name: contract.resourceName,
            schemaName: `${contract.resourceName}ContractSchema`,
            actions: relationProject(contract.actions, action => ({
                name: action.name,
                zodSchema: action.schemaCode,
                validatorName: `validate${toPascalCase(contract.resourceName)}${capitalize(action.name)}`,
                fieldCount: action.fieldCount,
            })),
            lineRange: [0, 0] as const,
        }),
    );
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
            warnings,
        },
        metadata: {
            hash: computeFingerprintHash(fingerprint),
            producer: producerName,
            dependencies: ['RequestTypes'],
            timestamp: Date.now(),
            revision: '1.0.0',
        },
    };
}
