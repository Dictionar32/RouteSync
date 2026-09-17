/**
 * @file SemanticResolutionContext.ts
 * @description Context boundary and AST structural extractors for SemanticResolver
 *
 * Active Consumer: Orchestrates semantic resolution context creation.
 *
 * @module cli/generators/semantic/SemanticResolutionContext
 */

import type { ParsedModel, ParsedResource, ParsedRoute, RouteManifest } from '@routesync/core';
import type { ActionType } from '../canonical-names';
import {
    resolveCanonicalAction,
    extractThisPropertyAccess,
    isNullableTernaryGuard,
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
    public readonly routes: readonly ParsedRoute[];
    public readonly models: readonly ParsedModel[];
    public readonly resources: readonly ParsedResource[];
    public readonly modelsByName: ReadonlyMap<string, ParsedModel>;
    public readonly resourcesByName: ReadonlyMap<string, ParsedResource>;

    constructor(
        routes: readonly ParsedRoute[],
        models: readonly ParsedModel[],
        resources: readonly ParsedResource[],
        modelsByName: ReadonlyMap<string, ParsedModel>,
        resourcesByName: ReadonlyMap<string, ParsedResource>
    ) {
        this.routes = Object.freeze(routes);
        this.models = Object.freeze(models);
        this.resources = Object.freeze(resources);
        this.modelsByName = modelsByName;
        this.resourcesByName = resourcesByName;
        Object.freeze(this);
    }

    public static fromManifest(manifest: RouteManifest): SemanticResolutionContext {
        const routes = manifest.routes;
        const models = manifest.models;
        const resources = manifest.resources;

        const modelsByName = new Map<string, ParsedModel>(models.map((model: ParsedModel) => [model.name.value, model] as const));
        const resourcesByName = new Map<string, ParsedResource>(resources.map((resource: ParsedResource) => [resource.name.value, resource] as const));

        return new SemanticResolutionContext(routes, models, resources, modelsByName, resourcesByName);
    }
}
