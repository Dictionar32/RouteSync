/**
 * Diagnostic Artifact
 * 
 * Contains compilation diagnostics (errors and warnings).
 * Accumulated throughout the compilation pipeline.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import type { DiagnosticBag } from '../diagnostics/DiagnosticBag';

/**
 * Artifact containing all diagnostics from compilation
 */
export class DiagnosticArtifact extends TypedArtifact<'DiagnosticSnapshot'> {
    public readonly typeId = 'DiagnosticSnapshot';

    constructor(
        public readonly diagnostics: DiagnosticBag,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
