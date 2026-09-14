import { describe, it, expect } from 'vitest';
import {
    HttpMethod,
    RouteActionKind,
    CrudRole,
    RouteHookKind,
    RequestContentType,
    ScannedRouteDescriptor,
    RouteBoundaryAdapter,
    type RouteBoundaryContract
} from '@routesync/core';
import {
    createRouteFromControllerAction,
    createRouteFromControllerReference,
    createRouteFromClosure,
    createSyntheticRoute
} from '@routesync/core/src/compiler/scanner/descriptors/route/factories';

describe('Route Boundary Contract & Factories SSOT Suite', () => {
    it('1. Verifies RouteBoundaryAdapter produces 4 Complete Sub-Contracts from minimal boundary parameters', () => {
        const subcontracts = RouteBoundaryAdapter.toSubcontracts({
            method: HttpMethod.GET,
            path: '/api/v1/articles'
        });

        // Guaranteed Identity Sub-Contract
        expect(subcontracts.identity).toBeDefined();
        expect(subcontracts.identity.method).toBe(HttpMethod.GET);
        expect(subcontracts.identity.path).toBe('/api/v1/articles');
        expect(subcontracts.identity.resourceName).toBe('articles');
        expect(subcontracts.identity.domain).toBe('articles');
        expect(subcontracts.identity.groupName).toBe('articles');
        expect(subcontracts.identity.runtimePath).toBe('/api/v1/articles');
        expect(subcontracts.identity.constantKey).toBe('API_V1_ARTICLES');
        expect(Object.isFrozen(subcontracts.identity)).toBe(true);

        // Guaranteed Binding Sub-Contract
        expect(subcontracts.binding).toBeDefined();
        expect(subcontracts.binding.actionName).toBe('query');
        expect(subcontracts.binding.controllerName).toBe('');
        expect(subcontracts.binding.responseTypeName).toBe('ArticlesResponse');
        expect(Object.isFrozen(subcontracts.binding)).toBe(true);

        // Guaranteed Capability Sub-Contract
        expect(subcontracts.capability).toBeDefined();
        expect(subcontracts.capability.hookKind).toBe(RouteHookKind.Query);
        expect(subcontracts.capability.actionKind).toBe(RouteActionKind.Read);
        expect(subcontracts.capability.isMutating).toBe(false);
        expect(subcontracts.capability.crudRole).toBe(CrudRole.Index);
        expect(subcontracts.capability.requestContentType).toBe(RequestContentType.None);
        expect(Object.isFrozen(subcontracts.capability)).toBe(true);

        // Guaranteed Provenance Sub-Contract
        expect(subcontracts.provenance).toBeDefined();
        expect(subcontracts.provenance.uri).toBe('/api/v1/articles');
        expect(Object.isFrozen(subcontracts.provenance)).toBe(true);

        // Combined EndpointContract
        expect(subcontracts.contract).toBeDefined();
        expect(Object.isFrozen(subcontracts.contract)).toBe(true);
    });

    it('2. Verifies createRouteFromControllerReference correctly produces frozen descriptor', () => {
        const route = createRouteFromControllerReference(ScannedRouteDescriptor.create, {
            method: HttpMethod.POST,
            path: '/api/v1/articles',
            controllerName: 'ArticleController',
            actionName: 'store',
            resourceName: 'articles'
        });

        expect(route.method).toBe(HttpMethod.POST);
        expect(route.path).toBe('/api/v1/articles');
        expect(route.controllerName).toBe('ArticleController');
        expect(route.actionName).toBe('store');
        expect(route.action).toBe('ArticleController@store');
        expect(route.isMutating).toBe(true);
        expect(route.hookKind).toBe(RouteHookKind.Mutation);
        expect(route.requestContentType).toBe(RequestContentType.Json);
        expect(Object.isFrozen(route)).toBe(true);
    });

    it('3. Verifies createRouteFromClosure correctly handles closure actions and payload type', () => {
        const route = createRouteFromClosure(ScannedRouteDescriptor.create, {
            method: HttpMethod.GET,
            path: '/api/v1/health',
            actionName: 'healthCheck',
            sourceFile: 'routes/api.php'
        });

        expect(route.method).toBe(HttpMethod.GET);
        expect(route.path).toBe('/api/v1/health');
        expect(route.action).toBe('closure@healthCheck');
        expect(route.controllerName).toBe('closure');
        expect(route.sourceFile).toBe('routes/api.php');
        expect(Object.isFrozen(route)).toBe(true);
    });

    it('4. Verifies createSyntheticRoute creates frozen fixture with defaults', () => {
        const synth = createSyntheticRoute(ScannedRouteDescriptor.create);

        expect(synth.method).toBe('GET');
        expect(synth.path).toBe('/synthetic');
        expect(synth.resourceName).toBe('Synthetic');
        expect(synth.actionName).toBe('index');
        expect(Object.isFrozen(synth)).toBe(true);
    });
});
