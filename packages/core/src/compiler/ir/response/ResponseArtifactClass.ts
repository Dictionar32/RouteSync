/**
 * ResponseArtifactClass.ts
 *
 * Core ResponseArtifact class representing complete response analysis results.
 * Pure analysis IR without backend or generation decisions.
 *
 * @module compiler/ir/response
 */

import type { FileSpan } from '../../types/FileSpan';
import type { ArtifactMetadata } from '../../artifacts/Artifact';
import { TypedArtifact } from '../../artifacts/Artifact';
import type { ResponseDescriptor, ConfidenceScore } from './responseDescriptors';
import type { ResponseBody } from './responseBodies';

/**
 * ResponseArtifact: Complete response analysis artifact
 *
 * Following compiler artifact pattern (class extends TypedArtifact).
 * Pure analysis results without backend/generator concerns.
 */
export class ResponseArtifact extends TypedArtifact<'ResponseArtifact'> {
    public readonly typeId = 'ResponseArtifact';

    constructor(
        /** Unique identifier (e.g., 'users.show.Response') */
        public readonly id: string,

        /** HOW response is transmitted (pure HTTP transport) */
        public readonly descriptor: ResponseDescriptor,

        /** WHAT response contains (optional: redirect/empty has no body) */
        public readonly body: ResponseBody | undefined,

        /** Confidence tracking with transparency */
        public readonly confidence: ConfidenceScore,

        /** Precise source location (byte-level granularity) */
        public readonly span: FileSpan | undefined,

        /** Pure analysis metadata (from base Artifact) */
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }

    public get responseBody(): ResponseBody {
        return this.body!;
    }

    public isCollection(): boolean {
        return this.body?.shape === 'collection' || this.body?.shape === 'paginated';
    }
}
