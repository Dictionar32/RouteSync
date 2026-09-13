/**
 * mapperAssembler.ts
 *
 * Assembles generated read/form mapper blocks and imports into final code and compiler artifacts.
 *
 * @module compiler/passes/mapper/mapperAssembler
 */

import type { GeneratedMapperArtifact } from '../../artifacts/GeneratedMapperArtifact';
import { computeFingerprintHash, type CompilerFingerprint } from '../../fingerprint/Fingerprint';
import type { CollectedMapperParts } from './resourceRegistry';

/**
 * Assembles final TypeScript source code for mappers/api-mapper.ts.
 */
export function assembleMapperCode(parts: CollectedMapperParts): string {
    const imports: string[] = [];

    if (parts.hasApiField) {
        imports.push(`import { ApiApiField } from '../contracts/api-field';`);
    }

    if (parts.contractImports.size > 0) {
        const sortedContractImports = Array.from(parts.contractImports).sort();
        imports.push(
            `import type {\n  ${sortedContractImports.join(',\n  ')}\n} from '../contracts/api-contract';`
        );
    }

    if (parts.formTypeImports.size > 0) {
        const sortedFormTypeImports = Array.from(parts.formTypeImports).sort();
        imports.push(
            `import type {\n  ${sortedFormTypeImports.join(',\n  ')}\n} from '../forms/api-form';`
        );
    }

    if (parts.readTypeImports.size > 0) {
        const sortedReadTypeImports = Array.from(parts.readTypeImports).sort();
        imports.push(
            `import type {\n  ${sortedReadTypeImports.join(',\n  ')}\n} from '../types/api-read';`
        );
    }

    const sections: string[] = [];

    if (parts.readMapperBlocks.length > 0) {
        sections.push('// ========== READ MAPPERS ==========\n' + parts.readMapperBlocks.join('\n\n'));
    }

    if (parts.formMapperBlocks.length > 0) {
        sections.push('// ========== FORM MAPPERS ==========\n' + parts.formMapperBlocks.join('\n\n'));
    }

    const header = imports.length > 0 ? imports.join('\n\n') + '\n\n' : '';
    return header + sections.join('\n\n') + (sections.length > 0 ? '\n' : '');
}

/**
 * Wraps generated mapper source code into a GeneratedMapperArtifact.
 */
export function buildMapperArtifact(code: string, producerName: string): GeneratedMapperArtifact {
    const fingerprint: CompilerFingerprint = {
        compilerVersion: '1.0.0',
        parserVersion: '1.0.0',
        phpVersion: '8.2.0',
        frameworkVersion: '10.0.0',
        targetBackend: 'typescript',
        strictMode: false,
        featureFlags: new Map()
    };

    return {
        typeId: 'GeneratedMapper',
        metadata: {
            hash: computeFingerprintHash(fingerprint),
            producer: producerName,
            dependencies: ['RequestTypes'],
            timestamp: Date.now(),
            revision: '1.0.0'
        },
        code
    };
}

/**
 * Builds an empty GeneratedMapperArtifact.
 */
export function buildEmptyMapperArtifact(producerName: string): GeneratedMapperArtifact {
    return buildMapperArtifact('', producerName);
}
