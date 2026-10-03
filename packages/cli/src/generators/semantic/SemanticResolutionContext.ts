/**
 * @file SemanticResolutionContext.ts
 * @description Context boundary and AST structural extractors for SemanticResolver
 *
 * Active Consumer: Orchestrates semantic resolution context creation.
 *
 * @module cli/generators/semantic/SemanticResolutionContext
 */

import type { ModelSemanticDefinition, ResourceAst, RouteSemanticFlow, RouteManifest } from '@routesync/core';
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
    public readonly routes: readonly RouteSemanticFlow[];
    public readonly models: readonly ModelSemanticDefinition[];
    public readonly resources: readonly ResourceAst[];
    public readonly modelsByName: ReadonlyMap<string, ModelSemanticDefinition>;
    public readonly resourcesByName: ReadonlyMap<string, ResourceAst>;

    constructor(
        routes: readonly RouteSemanticFlow[],
        models: readonly ModelSemanticDefinition[],
        resources: readonly ResourceAst[],
        modelsByName: ReadonlyMap<string, ModelSemanticDefinition>,
        resourcesByName: ReadonlyMap<string, ResourceAst>
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
        const models = manifest.models.map(model => model.definition.semantic);
        const resources = manifest.resources;

        const modelsByName = new Map<string, ModelSemanticDefinition>(models.map(model => [model.identity.name.value.value, model] as const));
        const resourcesByName = new Map<string, ResourceAst>(resources.map(resource => [resource.definition.name.value.value, resource] as const));

        return new SemanticResolutionContext(routes, models, resources, modelsByName, resourcesByName);
    }
}
