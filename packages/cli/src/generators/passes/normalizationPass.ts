/**
 * Normalization Pass.
 * Transforms RouteManifest into NormalizedManifest IR.
 *
 * @module cli/generators/passes
 */

import type { RouteManifest, SemanticResolutionKernel } from '@routesync/core';
import type { CompilerPass, CompilerContext } from '../pipeline';
import {
    type NormalizedManifest,
    normalizeModels,
    normalizeResources,
    normalizeRoutes
} from '../normalizer';

export class NormalizationPass implements CompilerPass<RouteManifest, NormalizedManifest> {
    readonly id = "normalizer";
    readonly name = "Normalization";
    readonly inputKind = "ResolvedManifest";
    readonly outputKind = "NormalizedManifest";

    private kernel: SemanticResolutionKernel;

    constructor(kernel: SemanticResolutionKernel) {
        this.kernel = kernel;
    }

    run(manifest: RouteManifest, context: CompilerContext): NormalizedManifest {
        const resources = normalizeResources(manifest, this.kernel);
        const models = normalizeModels(manifest, this.kernel);
        const routes = normalizeRoutes(manifest, this.kernel);

        return {
            irVersion: 1,
            version: manifest.version,
            baseURL: manifest.baseURL,
            routes,
            models,
            resources
        };
    }
}
