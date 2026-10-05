import { describe, it, expect } from 'vitest';
import {
    HttpMethod,
    RouteActionKind,
    CrudRole,
    RouteHookKind,
    RequestContentType,
    RouteBoundaryContractFactory,
    SemanticValueFactory,
    VoidResponseDescriptor,
    type RouteBoundaryOptions,
    type RouteBoundaryContract
} from '@routesync/core';
import { numberValue } from '../../core/src/types/upstream/valueObjects';
import { emptyRouteSchemaPayload } from '../../core/src/types/domain/validationRules';

const boundaryOptions = (overrides: Partial<RouteBoundaryOptions>): RouteBoundaryOptions => ({
    origin: 'controller_reference',
    method: HttpMethod.GET,
    path: SemanticValueFactory.routePath('/api/v1/articles'),
    name: SemanticValueFactory.routeName('articles.index'),
    resourceName: SemanticValueFactory.resourceName('articles'),
    domain: SemanticValueFactory.domainName('articles'),
    auth: false,
    middleware: [],
    parameters: [],
    pathParameters: [],
    queryParameters: [],
    response: VoidResponseDescriptor.create(),
    errorResponses: [],
    schema: emptyRouteSchemaPayload(),
    binding: {
        operation: {
            controllerName: SemanticValueFactory.controllerName('ArticleController'),
            name: SemanticValueFactory.actionName('index'),
            handler: Object.freeze({
                kind: 'controller_action',
                controllerName: SemanticValueFactory.controllerName('ArticleController'),
                actionName: SemanticValueFactory.actionName('index'),
                target: SemanticValueFactory.className('ArticleController@index')
            })
        },
        request: { kind: 'no_request' }
    },
    runtimeReturn: { kind: 'none' },
    semanticReturn: { kind: 'absent' },
    controllerName: SemanticValueFactory.controllerName('ArticleController'),
    actionName: SemanticValueFactory.actionName('index'),
    action: SemanticValueFactory.actionName('index'),
    sourceFile: SemanticValueFactory.sourceFilePath('routes/api.php'),
    sourceLine: numberValue(1),
    ...overrides
});

describe('Route Boundary Contract SSOT Suite', () => {
    it('1. RouteBoundaryContractFactory produces the four closed sub-contracts', () => {
        const contract: RouteBoundaryContract = RouteBoundaryContractFactory.create(boundaryOptions({
            method: HttpMethod.GET,
            path: SemanticValueFactory.routePath('/api/v1/articles')
        }));

        expect(contract.identity).toBeDefined();
        expect(contract.identity.coordinates.method).toBe(HttpMethod.GET);
        expect(contract.identity.coordinates.path).toEqual(SemanticValueFactory.routePath('/api/v1/articles'));
        expect(contract.identity.domain.resource).toEqual(SemanticValueFactory.resourceName('articles'));
        expect(contract.identity.domain.group).toEqual(SemanticValueFactory.domainName('articles'));
        expect(Object.isFrozen(contract.identity)).toBe(true);

        expect(contract.binding).toBeDefined();
        expect(contract.binding.operation.name).toEqual(SemanticValueFactory.actionName('index'));
        expect(contract.binding.response).toBeDefined();
        expect(Object.isFrozen(contract.binding)).toBe(true);

        expect(contract.capability).toBeDefined();
        expect(contract.capability.hookKind).toBe(RouteHookKind.Query);
        expect(contract.capability.actionKind).toBe(RouteActionKind.Read);
        expect(contract.capability.crudRole).toBe(CrudRole.Index);
        expect(contract.capability.requestContentType).toBe(RequestContentType.None);
        expect(Object.isFrozen(contract.capability)).toBe(true);

        expect(contract.provenance.uri).toEqual(SemanticValueFactory.routePath('/api/v1/articles'));
        expect(Object.isFrozen(contract.provenance)).toBe(true);
        expect(Object.isFrozen(contract.contract)).toBe(true);
    });

    it('2. controller-reference routes stay inside RouteBoundaryContractFactory', () => {
        const contract = RouteBoundaryContractFactory.create(boundaryOptions({
            method: HttpMethod.POST,
            actionName: SemanticValueFactory.actionName('store'),
            action: SemanticValueFactory.actionName('store'),
            controllerName: SemanticValueFactory.controllerName('ArticleController'),
            name: SemanticValueFactory.routeName('articles.store')
        }));

        expect(contract.identity.coordinates.method).toBe(HttpMethod.POST);
        expect(contract.binding.operation.controllerName).toEqual(SemanticValueFactory.controllerName('ArticleController'));
        expect(contract.binding.operation.name).toEqual(SemanticValueFactory.actionName('store'));
        expect(contract.capability.isMutating).toBe(true);
        expect(Object.isFrozen(contract)).toBe(true);
    });

    it('3. closure routes stay represented as canonical boundary contracts', () => {
        const contract = RouteBoundaryContractFactory.create(boundaryOptions({
            origin: 'closure',
            actionName: SemanticValueFactory.actionName('healthCheck'),
            action: SemanticValueFactory.actionName('closure@healthCheck'),
            controllerName: SemanticValueFactory.controllerName(''),
            name: SemanticValueFactory.routeName('health'),
            binding: {
                operation: {
                    controllerName: SemanticValueFactory.controllerName(''),
                    name: SemanticValueFactory.actionName('closure@healthCheck'),
                    handler: Object.freeze({
                        kind: 'closure',
                        actionName: SemanticValueFactory.actionName('healthCheck'),
                        target: SemanticValueFactory.className('closure@healthCheck')
                    })
                },
                request: { kind: 'no_request' }
            }
        }));

        expect(contract.identity.coordinates.method).toBe(HttpMethod.GET);
        expect(contract.binding.operation.name).toEqual(SemanticValueFactory.actionName('closure@healthCheck'));
        expect(Object.isFrozen(contract)).toBe(true);
    });

    it('4. synthetic route defaults are expressed as boundary semantics, not a legacy factory', () => {
        const contract = RouteBoundaryContractFactory.create(boundaryOptions({
            origin: 'synthetic',
            name: SemanticValueFactory.routeName('synthetic'),
            resourceName: SemanticValueFactory.resourceName('Synthetic'),
            domain: SemanticValueFactory.domainName('Synthetic'),
            actionName: SemanticValueFactory.actionName('index'),
            action: SemanticValueFactory.actionName('synthetic@index'),
            controllerName: SemanticValueFactory.controllerName('SyntheticController')
        }));

        expect(contract.identity.coordinates.method).toBe(HttpMethod.GET);
        expect(contract.identity.domain.resource).toEqual(SemanticValueFactory.resourceName('Synthetic'));
        expect(Object.isFrozen(contract)).toBe(true);
    });
});
