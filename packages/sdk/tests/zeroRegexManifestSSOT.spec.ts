import { describe, it, expect } from 'vitest';
import {
    ScannedResourceDescriptor,
    ScannedRouteDescriptor,
    RouteManifest
} from '@routesync/core';
import { buildEnumsLines } from '../../cli/src/generators/constants/enumConstantsBuilder';
import { buildRoutesLines } from '../../cli/src/generators/constants/routesObjectBuilder';

describe('Rule 10 & 12: Zero Regex & Complete Guaranteed Manifest Contracts SSOT', () => {
    describe('Resource modelName Contract', () => {
        it('guarantees modelName is always present and non-nullable on ScannedResourceDescriptor', () => {
            const res1 = ScannedResourceDescriptor.create({
                name: 'OrderResource',
                fields: [],
                modelName: 'Order'
            });
            expect(res1.modelName).toBe('Order');
            expect(typeof res1.modelName).toBe('string');

            // Default fallback uses stripped name directly at Origin Boundary
            const res2 = ScannedResourceDescriptor.create({
                name: 'PaymentResource',
                fields: []
            });
            expect(res2.modelName).toBe('Payment');
            expect(typeof res2.modelName).toBe('string');
        });
    });

    describe('RouteIdentity constantKey Contract', () => {
        it('guarantees constantKey is computed at Origin Boundary and frozen in RouteIdentityContract', () => {
            const route = ScannedRouteDescriptor.create({
                method: 'GET',
                path: '/api/orders/{id}',
                action: 'OrderController@show'
            });

            expect(route.identity.constantKey).toBe('API_ORDERS_DETAIL');
            expect(route.identity.runtimePath).toBe('/api/orders/:id');
            expect(typeof route.identity.constantKey).toBe('string');
        });
    });

    describe('Zero Regex Generator Emitters', () => {
        it('buildRoutesLines consumes identity.constantKey directly without path splitting regex', () => {
            const route = ScannedRouteDescriptor.create({
                method: 'GET',
                path: '/api/categories',
                action: 'CategoryController@index',
                name: 'categories.index'
            });

            const manifest: RouteManifest = {
                routes: [route],
                baseURL: 'http://localhost/api',
                generatedAt: new Date().toISOString()
            };

            const lines = buildRoutesLines(manifest);
            expect(lines.some(l => l.includes('API_CATEGORIES'))).toBe(true);
        });

        it('buildEnumsLines processes enum rules from AST without regex fallback', () => {
            const route = ScannedRouteDescriptor.create({
                method: 'POST',
                path: '/api/status/update',
                schema: {
                    rules: [
                        {
                            fieldName: 'status',
                            propertyName: 'status',
                            rules: ['required', 'in:active,inactive'],
                            ast: [
                                { kind: 'required' as any },
                                { kind: 'in' as any, values: ['active', 'inactive'] }
                            ]
                        }
                    ]
                }
            });

            const manifest: RouteManifest = {
                routes: [route],
                baseURL: 'http://localhost/api',
                generatedAt: new Date().toISOString()
            };

            const lines = buildEnumsLines(manifest);
            expect(lines.some(l => l.includes('ACTIVE: \'active\''))).toBe(true);
            expect(lines.some(l => l.includes('INACTIVE: \'inactive\''))).toBe(true);
        });
    });
});
