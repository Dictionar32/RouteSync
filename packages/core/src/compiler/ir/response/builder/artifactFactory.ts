/**
 * artifactFactory.ts
 *
 * Assembles a frozen ResponseArtifact with computed hash and metadata.
 *
 * @module core/compiler/ir/response/builder
 */

import type { FileSpan } from '../../../types/FileSpan';
import type { ArtifactMetadata } from '../../../artifacts/Artifact';
import type { ResponseDescriptor, ConfidenceScore } from '../responseDescriptors';
import type { ResponseBody } from '../responseBodies';
import { ResponseArtifact } from '../ResponseArtifactClass';
import { computeResponseContentHash } from '../responseHash';

export function buildResponseArtifact(
  id: string,
  descriptor: ResponseDescriptor,
  body: ResponseBody | undefined,
  confidence: ConfidenceScore,
  span: FileSpan | undefined,
  metadataPartial: Partial<ArtifactMetadata>
): ResponseArtifact {
  const metadata: ArtifactMetadata = {
    hash: computeResponseContentHash(id, descriptor, body, confidence),
    producer: metadataPartial.producer || 'ResponseAnalysisPass',
    dependencies: metadataPartial.dependencies || [],
    timestamp: metadataPartial.timestamp || Date.now(),
    revision: metadataPartial.revision || '1.0.0'
  };

  return new ResponseArtifact(id, descriptor, body, confidence, span, metadata);
}
