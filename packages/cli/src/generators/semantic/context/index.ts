/**
 * SemanticResolutionContext sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module cli/generators/semantic/context
 */

export {
    resolveCanonicalAction,
    extractThisPropertyAccess,
    isNullableTernaryGuard
} from './astExtractors';

export {
    normalizeModelsFromManifest,
    normalizeResourcesFromManifest
} from './manifestNormalizer';
