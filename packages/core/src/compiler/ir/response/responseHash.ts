/**
 * responseHash.ts
 *
 * Deterministic hash computation for ResponseArtifact content.
 *
 * @module compiler/ir/response
 */

/**
 * Deterministic hash computation based on response content only (no timestamp).
 */
export function computeResponseContentHash(
    id: string,
    descriptor: unknown,
    body: unknown,
    confidence: unknown
): string {
    const content = JSON.stringify({
        id,
        descriptor,
        body,
        confidence,
    });
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) - hash) + content.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
