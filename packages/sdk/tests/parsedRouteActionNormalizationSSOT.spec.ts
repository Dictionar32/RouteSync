import { describe, test, expect } from 'vitest'
import {
    ScannedRouteDescriptor,
    ScannedEndpointContract,
    ScannedRouteCacheInvalidationDescriptor,
    RouteHandlerKind,
    matchRouteHandler,
    ParsedRoute
} from '../../core/src'

describe('ParsedRoute Level B ADT & Ordered Array SSOT Suite', () => {
    test('should normalize action "OrderController@index" into ControllerAction handler ADT', () => {
        const route = ScannedRouteDescriptor.create({
            method: 'GET',
            path: '/orders',
            action: 'OrderController@index'
        })

        expect(route.controllerName).toBe('OrderController')
        expect(route.actionName).toBe('index')
        expect(route.action).toBe('OrderController@index')
        expect(route.name).toBe('orders.index')

        // ADT Verification
        expect(route.handler.kind).toBe(RouteHandlerKind.ControllerAction)
        if (route.handler.kind === RouteHandlerKind.ControllerAction) {
            expect(route.handler.controllerName).toBe('OrderController')
            expect(route.handler.actionName).toBe('index')
            expect(route.handler.target).toBe('OrderController@index')
        }

        // Catamorphism Verification (0 if, 0 switch)
        const matched = matchRouteHandler(route.handler, {
            controllerAction: (h) => `Action:${h.controllerName}@${h.actionName}`,
            invokableController: (h) => `Invokable:${h.controllerName}`,
            closure: (h) => `Closure:${h.actionName}`
        })
        expect(matched).toBe('Action:OrderController@index')
    })

    test('should classify invokable controller into InvokableController handler ADT', () => {
        const route = ScannedRouteDescriptor.create({
            method: 'GET',
            path: '/dashboard',
            controllerName: 'DashboardController',
            actionName: '__invoke'
        })

        expect(route.handler.kind).toBe(RouteHandlerKind.InvokableController)
        const matched = matchRouteHandler(route.handler, {
            controllerAction: (h) => `Action:${h.controllerName}@${h.actionName}`,
            invokableController: (h) => `Invokable:${h.controllerName}`,
            closure: (h) => `Closure:${h.actionName}`
        })
        expect(matched).toBe('Invokable:DashboardController')
    })

    test('should classify route without controller into Closure handler ADT', () => {
        const route = ScannedRouteDescriptor.create({
            method: 'GET',
            path: '/health',
            actionName: 'health'
        })

        expect(route.handler.kind).toBe(RouteHandlerKind.Closure)
        const matched = matchRouteHandler(route.handler, {
            controllerAction: (h) => `Action:${h.controllerName}@${h.actionName}`,
            invokableController: (h) => `Invokable:${h.controllerName}`,
            closure: (h) => `Closure:${h.actionName}`
        })
        expect(matched).toBe('Closure:health')
    })

    test('should provide empty ordered array [] for formRequests when route has no FormRequest (0 null, 0 undefined, 0 ?)', () => {
        const route = ScannedRouteDescriptor.create({
            method: 'GET',
            path: '/orders'
        })

        expect(route.formRequests).toEqual([])
        expect(route.formRequests.length).toBe(0)
    })

    test('should populate formRequests ordered array when FormRequest is specified', () => {
        const route = ScannedRouteDescriptor.create({
            method: 'POST',
            path: '/orders',
            domain: 'Order',
            action: 'OrderController@store',
            formRequests: ['StoreOrderRequest']
        })

        expect(route.formRequests.length).toBe(1)
        expect(route.formRequests[0].name).toBe('StoreOrderRequest')
        expect(route.formRequests[0].sourceFile).toBe('app/Http/Requests/StoreOrderRequest.php')

        const contract = ScannedEndpointContract.fromRoute(route)
        expect(contract).toBeDefined()
        expect(contract.provenance.request?.symbol).toBe('StoreOrderRequest')
        expect(contract.provenance.request?.file).toBe('app/Http/Requests/StoreOrderRequest.php')
    })

    test('should preserve handler ADT and formRequests ordered array across withInvalidation', () => {
        const route = ScannedRouteDescriptor.create({
            method: 'POST',
            path: '/orders',
            domain: 'Order',
            action: 'OrderController@store',
            formRequests: ['StoreOrderRequest']
        })

        const routeWithInvalidation = route.withInvalidation(
            ScannedRouteCacheInvalidationDescriptor.empty()
        )

        expect(routeWithInvalidation.handler.kind).toBe(RouteHandlerKind.ControllerAction)
        expect(routeWithInvalidation.formRequests.length).toBe(1)
        expect(routeWithInvalidation.formRequests[0].name).toBe('StoreOrderRequest')
    })
})
