import { TypedArtifact, type ArtifactMetadata } from './Artifact';
import type { ResponseArtifact } from '../ir/ResponseArtifact';

/**
 * Aggregate response-analysis artifact produced by ResponseAnalysisPass.
 * Each entry is keyed by the stable response artifact id for a route.
 */
export class ResponseAnalysisArtifact extends TypedArtifact<'ResponseAnalysis'> {
    public readonly typeId = 'ResponseAnalysis' as const;

    constructor(
        public readonly responses: ReadonlyMap<string, ResponseArtifact>,
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}