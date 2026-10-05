/**
 * Relation-oriented mapper artifact assembly.
 */
import type { GeneratedMapperArtifact } from '../../artifacts/GeneratedMapperArtifact';
import { computeFingerprintHash, type CompilerFingerprint } from '../../fingerprint/Fingerprint';
import type { CollectedMapperParts } from './resourceRegistry';
import { relationResolve, relationEqual } from '../../../semantic/foundation/relationalSequence';

const importBlock = (names: readonly string[], modulePath: string): string => relationResolve(
    relationEqual(names.length, 0),
    () => '',
    () => `import type {\n  ${[...names].sort().join(',\n  ')}\n} from '${modulePath}';\n\n`,
);

const sectionBlock = (title: string, blocks: readonly string[]): string => relationResolve(
    relationEqual(blocks.length, 0),
    () => '',
    () => `// ========== ${title} ==========\n${blocks.join('\n\n')}\n\n`,
);

export function assembleMapperCode(parts: CollectedMapperParts): string {
    const apiFieldImport = relationResolve(
        relationEqual(parts.hasApiField, true),
        () => "import { ApiApiField } from '../contracts/api-field';\n\n",
        () => '',
    );
    const imports = [
        apiFieldImport,
        importBlock(parts.contractImports, '../contracts/api-contract'),
        importBlock(parts.formTypeImports, '../forms/api-form'),
        importBlock(parts.readTypeImports, '../types/api-read'),
    ].join('');
    const sections = [
        sectionBlock('READ MAPPERS', parts.readMapperBlocks),
        sectionBlock('FORM MAPPERS', parts.formMapperBlocks),
    ].join('');
    return `${imports}${sections}`;
}

export function buildMapperArtifact(code: string, producerName: string): GeneratedMapperArtifact {
    const fingerprint: CompilerFingerprint = {
        compilerVersion: '1.0.0',
        parserVersion: '1.0.0',
        phpVersion: '8.2.0',
        frameworkVersion: '10.0.0',
        targetBackend: 'typescript',
        strictMode: false,
        featureFlags: Object.freeze([]),
    };
    return {
        typeId: 'GeneratedMapper',
        metadata: {
            hash: computeFingerprintHash(fingerprint),
            producer: producerName,
            dependencies: ['RequestTypes'],
            timestamp: Date.now(),
            revision: '1.0.0',
        },
        code,
    };
}

export const buildEmptyMapperArtifact = (producerName: string): GeneratedMapperArtifact => buildMapperArtifact('', producerName);
