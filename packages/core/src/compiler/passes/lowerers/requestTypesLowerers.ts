/**
 * requestTypesLowerers.ts
 *
 * Lowerers for forms, contracts, api-fields, and mappers.
 *
 * @module compiler/passes/lowerers
 */

import type { RequestTypesArtifact } from '../../artifacts/RequestTypesArtifact';
import type { RouteManifest } from '../../../types/route';
import { lowerFormArtifact } from '../FormGeneratorPass';
import { lowerContractArtifact } from '../ContractGeneratorPass';
import { lowerApiFieldArtifact } from '../ApiFieldGeneratorPass';
import { lowerMapperArtifact } from '../MapperGeneratorPass';
import type {
    FormOutput,
    ContractOutput,
    ApiFieldOutput,
    MapperOutput
} from './types';

export function lowerFormTypesOutput(
    artifact: RequestTypesArtifact,
    manifest: RouteManifest
): FormOutput {
    const formArtifact = lowerFormArtifact(artifact);

    const formTypes = formArtifact.formTypes.map(ft => ft.name);
    const warnings: string[] = [...formArtifact.generationMetadata.warnings];

    if (formArtifact.generationMetadata.formTypeCount === 0) {
        warnings.push('No validation rules found in manifest');
    }

    return {
        code: formArtifact.code,
        formTypes,
        metadata: {
            formTypeCount: formArtifact.generationMetadata.formTypeCount,
            totalActions: formArtifact.generationMetadata.totalActions,
            linesOfCode: formArtifact.generationMetadata.linesOfCode,
            warnings
        }
    };
}

export function lowerContractsOutput(
    artifact: RequestTypesArtifact,
    manifest: RouteManifest
): ContractOutput {
    const contractArtifact = lowerContractArtifact(artifact);

    const contracts = contractArtifact.contracts.map(c => c.name);
    const warnings: string[] = [...contractArtifact.generationMetadata.warnings];

    if (contractArtifact.generationMetadata.contractCount === 0) {
        warnings.push('No validation rules found in manifest');
    }

    return {
        code: contractArtifact.code,
        contracts,
        metadata: {
            contractCount: contractArtifact.generationMetadata.contractCount,
            totalActions: contractArtifact.generationMetadata.totalActions,
            zodSchemasCount: contractArtifact.generationMetadata.zodSchemasCount,
            validatorsCount: contractArtifact.generationMetadata.validatorsCount,
            linesOfCode: contractArtifact.generationMetadata.linesOfCode,
            warnings
        }
    };
}

export function lowerApiFieldsOutput(artifact: RequestTypesArtifact): ApiFieldOutput {
    const apiFieldArtifact = lowerApiFieldArtifact(artifact);
    return {
        code: apiFieldArtifact.code,
        metadata: {
            linesOfCode: apiFieldArtifact.code.split('\n').length,
            warnings: []
        }
    };
}

export function lowerMappersOutput(artifact: RequestTypesArtifact): MapperOutput {
    const mapperArtifact = lowerMapperArtifact(artifact);
    return {
        code: mapperArtifact.code,
        metadata: {
            linesOfCode: mapperArtifact.code.split('\n').length,
            warnings: []
        }
    };
}
