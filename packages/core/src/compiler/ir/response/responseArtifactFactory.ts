/**
 * responseArtifactFactory.ts
 *
 * Factory function to create ResponseArtifact instances without direct builder instantiation.
 *
 * @module compiler/ir/response
 */

import type { FileSpan } from '../../types/FileSpan';
import type { ArtifactMetadata } from '../../artifacts/Artifact';
import type { ConfidenceScore, ResponseDescriptor } from './responseDescriptors';
import type { ResponseBody } from './responseBodies';
import type { ResponseArtifact } from './ResponseArtifactClass';
import { ResponseArtifactBuilder } from './ResponseArtifactBuilder';

export interface CreateResponseArtifactOptions {
    readonly id: string;
    readonly descriptor: ResponseDescriptor;
    readonly body?: ResponseBody;
    readonly confidence?: ConfidenceScore;
    readonly span?: FileSpan;
    readonly metadata?: Partial<ArtifactMetadata>;
}

/**
 * Pure Factory: Create ResponseArtifact without manual builder instantiation.
 * Consumes complete descriptor and returns verified ResponseArtifact.
 */
export function createResponseArtifact(options: CreateResponseArtifactOptions): ResponseArtifact {
    const builder = new ResponseArtifactBuilder()
        .id(options.id)
        .transport(options.descriptor.transport);

    if (options.descriptor.status !== undefined) builder.status(options.descriptor.status);
    if (options.descriptor.contentType !== undefined) builder.contentType(options.descriptor.contentType);
    if (options.descriptor.nullable !== undefined) builder.nullable(options.descriptor.nullable);
    if (options.descriptor.contentDisposition !== undefined) {
        builder.contentDisposition(
            options.descriptor.contentDisposition.type,
            options.descriptor.contentDisposition.filename
        );
    }
    if (options.body !== undefined) builder.body(options.body);
    if (options.confidence !== undefined) builder.confidence(options.confidence);
    if (options.span !== undefined) builder.span(options.span);
    if (options.metadata !== undefined) builder.metadata(options.metadata);

    return builder.build();
}
