/**
 * readTypesLowerer.ts
 *
 * Lowerer for read-types / SemanticTypesArtifact.
 *
 * @module compiler/passes/lowerers
 */

import type { SemanticTypesArtifact } from '../../artifacts/SemanticTypesArtifact';
import type { RouteManifest } from '../../../types/route';
import { lowerTypeScriptArtifact } from '../TypeScriptGeneratorPass';
import type { CompilerOutput } from './types';

export function lowerReadTypesOutput(
    artifact: SemanticTypesArtifact,
    manifest: RouteManifest
): CompilerOutput {
    const tsArtifact = lowerTypeScriptArtifact({
        ...artifact,
        types: Array.from(artifact.types)
    });

    const imports = tsArtifact.imports.map(imp =>
        `import { ${imp.names.join(', ')} } from '${imp.from}'`
    );
    const interfaces = tsArtifact.interfaces.map(iface => iface.name);
    const warnings: string[] = [...tsArtifact.generationMetadata.warnings];

    if (!manifest.models || manifest.models.length === 0) {
        warnings.push('No models found in manifest');
    }
    if (!manifest.resources || manifest.resources.length === 0) {
        warnings.push('No resources found in manifest');
    }

    return {
        code: tsArtifact.code,
        imports,
        interfaces,
        metadata: {
            typeCount: tsArtifact.generationMetadata.typeCount,
            interfaceCount: tsArtifact.generationMetadata.interfaceCount,
            linesOfCode: tsArtifact.generationMetadata.linesOfCode,
            warnings
        }
    };
}
