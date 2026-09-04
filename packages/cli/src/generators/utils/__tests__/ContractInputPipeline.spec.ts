import { describe, test, expect } from 'vitest';
import { ContractInputPipeline } from '../ContractInputPipeline';
import type { RouteManifest } from '../../../../core/src/types/route';
import { PrimitiveType, PrimitiveKind } from '../../../../core/src/compiler/types/SemanticType';

describe('ContractInputPipeline Specification (TDD Suite)', () => {
    test('1. Groups routes by resource and extracts preserved contract request fields', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    path: '/api/orders',
                    method: 'POST',
                    schema: {
                        rules: {
                            'customer_email': ['required', 'string'],
                            'items.*.product_id': ['required', 'integer']
                        }
                    }
                }
            ],
            resources: [],
            models: []
        };

        const pipeline = new ContractInputPipeline();
        const artifact = pipeline.execute(manifest);

        expect(artifact.requestTypes).toHaveLength(1);
        const orderReq = artifact.requestTypes[0];
        expect(orderReq.resourceName).toBe('orders');
        expect(orderReq.actions).toHaveLength(1);
        expect(orderReq.actions[0].fields[0].originalName).toBe('customer_email');
    });

    test('2. Extracts response schema and infers numeric request field types (Issue #2)', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    path: '/api/categories',
                    method: 'POST',
                    schema: {
                        rules: {
                            'parent_id': ['required'] // Default string
                        }
                    },
                    response: {
                        kind: 'resource',
                        resource: 'CategoryResource'
                    }
                },
                {
                    path: '/api/categories',
                    method: 'GET',
                    response: {
                        kind: 'resource',
                        resource: 'CategoryResource'
                    }
                }
            ],
            resources: [
                {
                    name: 'CategoryResource',
                    fields: {
                        parent_id: { kind: 'primitive', type: 'int' }
                    }
                }
            ],
            models: []
        };

        const pipeline = new ContractInputPipeline();
        const artifact = pipeline.execute(manifest);

        const categoryReq = artifact.requestTypes[0];
        const parentIdField = categoryReq.actions[0].fields[0];
        expect(parentIdField.type).toBeInstanceOf(PrimitiveType);
        expect((parentIdField.type as PrimitiveType).type).toBe(PrimitiveKind.NUMBER);
    });

    test('3. Deduplicates global response resources across multiple route groups', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    path: '/api/cart/items',
                    method: 'POST',
                    response: { kind: 'resource', resource: 'OrderResource' }
                },
                {
                    path: '/api/checkout',
                    method: 'POST',
                    response: { kind: 'resource', resource: 'OrderResource' }
                }
            ],
            resources: [
                {
                    name: 'OrderResource',
                    fields: { id: { kind: 'primitive', type: 'int' } }
                }
            ],
            models: []
        };

        const pipeline = new ContractInputPipeline();
        const artifact = pipeline.execute(manifest);
