/**
 * @file SemanticResolutionContext.ts
 * @description Context boundary and AST structural extractors for SemanticResolver
 *
 * Active Consumer: Orchestrates semantic resolution context creation.
 *
 * @module cli/generators/semantic/SemanticResolutionContext
 */

import type { RouteManifest } from '@routesync/core';
import type { ActionType } from '../canonical-names';
import type { NormalizedModelInfo } from './semanticTypes';
import {
    resolveCanonicalAction,
    extractThisPropertyAccess,
    isNullableTernaryGuard,
    normalizeModelsFromManifest,
    normalizeResourcesFromManifest
} from './context';

export {
    type ActionType,
    resolveCanonicalAction,
    extractThisPropertyAccess,
    isNullableTernaryGuard
};

/**
 * SemanticResolutionContext
 * 
 * Origin Boundary context that guarantees non-nullable collections
 * and O(1) indexed lookups for models and resources.
 */
export class SemanticResolutionContext {
    public readonly routes: readonly any[];
    public readonly models: readonly any[];
    public readonly resources: readonly any[];
    public readonly modelsByName: Map<string, NormalizedModelInfo>;
    public readonly resourcesByName: Map<string, any>;

    constructor(
        routes: readonly any[],
        models: readonly any[],
        resources: readonly any[],
        modelsByName: Map<string, NormalizedModelInfo>,
        resourcesByName: Map<string, any>
    ) {
        this.routes = Object.freeze(routes);
        this.models = Object.freeze(models);
        this.resources = Object.freeze(resources);
        this.modelsByName = modelsByName;
        this.resourcesByName = resourcesByName;
        Object.freeze(this);
    }

    public static fromManifest(manifest: RouteManifest): SemanticResolutionContext {
        const routes: any[] = Array.isArray(manifest.routes) ? manifest.routes : [];
        const models: any[] = Array.isArray(manifest.models) ? manifest.models : [];
        const resources: any[] = Array.isArray(manifest.resources) ? manifest.resources : [];

        const modelsByName = normalizeModelsFromManifest(models);
        const resourcesByName = normalizeResourcesFromManifest(resources);

        return new SemanticResolutionContext(routes, models, resources, modelsByName, resourcesByName);
    }
}
