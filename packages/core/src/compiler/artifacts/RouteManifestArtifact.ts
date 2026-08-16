import type { RouteManifest } from '../../types/route';
import { TypedArtifact, type ArtifactMetadata } from './Artifact';

/**
 * External route manifest supplied to response-analysis passes.
 * The manifest is a semantic input artifact, not compiler context state.
 */
export class RouteManifestArtifact extends TypedArtifact<'RouteManifest'> {
    public readonly typeId = 'RouteManifest' as const;

    constructor(
        public readonly manifest: RouteManifest,
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}