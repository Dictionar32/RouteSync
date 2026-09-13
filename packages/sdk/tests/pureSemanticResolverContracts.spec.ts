/**
 * pureSemanticResolverContracts.spec.ts
 *
 * Regression test suite verifying:
 * 1. SemanticResolutionContext Origin Boundary guarantees non-nullable collections & O(1) lookups.
 * 2. SemanticResolver.resolve() produces complete, deterministic CompilerIR.
 * 3. Pure AST extractors (extractThisPropertyAccess, isNullableTernaryGuard, resolveCanonicalAction).
 * 4. FieldResolutionMeta complete contract and toFieldResolutionMeta factory.
 */

import { describe, it, expect } from 'vitest'
import {
    SemanticResolver,
    SemanticResolutionContext,
    resolveCanonicalAction,
    extractThisPropertyAccess,
    isNullableTernaryGuard,
    toFieldResolutionMeta,
} from '../../../packages/cli/src/generators/semantic-resolver'
import type { RouteManifest } from '@routesync/core'

describe('pureSemanticResolverContracts', () => {
    describe('SemanticResolutionContext Origin Boundary', () => {
        it('should handle completely empty or undefined manifest fields without error', () => {
            const emptyManifest: RouteManifest = {
                version: '1.0',
                routes: [],
                models: [],
                resources: [],
            }
            const ctx = SemanticResolutionContext.fromManifest(emptyManifest)
            expect(ctx.routes).toEqual([])
            expect(ctx.models).toEqual([])
            expect(ctx.resources).toEqual([])
            expect(ctx.modelsByName.size).toBe(0)
            expect(ctx.resourcesByName.size).toBe(0)
        })

        it('should index models and their columns and casts in O(1) maps', () => {
            const manifest: any = {
                version: '1.0',
                routes: [],
                models: [
                    {
                        name: 'User',
                        table: 'users',
                        columns: [
                            { name: 'id', type: 'bigint', nullable: false },
                            { name: 'email', type: 'varchar(255)', nullable: true },
                        ],
                        casts: {
                            id: 'integer',
                        },
                    },
                    {
                        name: 'Post',
                        table: 'posts',
                        columns: [
                            { name: 'id', type: 'bigint', nullable: false },
                        ],
                        casts: [
                            { column: 'id', targetType: 'int' },
                        ],
                    },
                ],
                resources: [
                    { name: 'UserResource', fields: {} },
                ],
            }

            const ctx = SemanticResolutionContext.fromManifest(manifest)
            expect(ctx.modelsByName.has('User')).toBe(true)
            expect(ctx.modelsByName.has('Post')).toBe(true)
            expect(ctx.resourcesByName.has('UserResource')).toBe(true)

            const userModel = ctx.modelsByName.get('User')!
            expect(userModel.columns).toHaveLength(2)
            expect(userModel.columnsByName.get('id')).toBeDefined()
            expect(userModel.columnsByName.get('id')?.type).toBe('bigint')
            expect(userModel.columnsByName.get('email')?.nullable).toBe(true)
            expect(userModel.casts.get('id')).toBe('integer')

            const postModel = ctx.modelsByName.get('Post')!
            expect(postModel.casts.get('id')).toBe('int')
        })
    })

    describe('Pure Helper Functions & AST Extractors', () => {
        describe('resolveCanonicalAction', () => {
            it('should map standard HTTP methods correctly', () => {
                expect(resolveCanonicalAction('get')).toBe('Get')
                expect(resolveCanonicalAction('GET')).toBe('Get')
                expect(resolveCanonicalAction('post')).toBe('Create')
                expect(resolveCanonicalAction('POST')).toBe('Create')
                expect(resolveCanonicalAction('put')).toBe('Update')
                expect(resolveCanonicalAction('patch')).toBe('Update')
                expect(resolveCanonicalAction('delete')).toBe('Delete')
            })

            it('should safely default to Get when method is unknown or undefined', () => {
                expect(resolveCanonicalAction(undefined)).toBe('Get')
                expect(resolveCanonicalAction('')).toBe('Get')
                expect(resolveCanonicalAction('options')).toBe('Get')
            })
        })

        describe('extractThisPropertyAccess', () => {
            it('should extract property name from raw_code with property_access on $this', () => {
                const fieldDef = {
                    kind: 'raw_code',
                    parsed_ast: {
                        kind: 'property_access',
                        target: {
                            kind: 'variable',
                            name: 'this',
                        },
                        property: 'user_id',
                    },
                }
                expect(extractThisPropertyAccess(fieldDef)).toBe('user_id')
            })

            it('should return null if not raw_code or not accessing $this', () => {
                expect(extractThisPropertyAccess({ kind: 'primitive', type: 'string' })).toBeNull()
                expect(extractThisPropertyAccess({
                    kind: 'raw_code',
                    parsed_ast: {
                        kind: 'property_access',
                        target: { kind: 'variable', name: 'request' },
                        property: 'user_id',
                    },
                })).toBeNull()
                expect(extractThisPropertyAccess({ kind: 'raw_code', parsed_ast: null })).toBeNull()
            })
        })

        describe('isNullableTernaryGuard', () => {
            it('should detect ternary pattern where falsy is null and truthy right is null', () => {
                const ast = {
                    kind: 'ternary',
                    falsy: { kind: 'primitive', type: 'null' },
                    truthy: {
                        kind: 'binary_expression',
                        right: { kind: 'primitive', type: 'null' },
                    },
                }
                expect(isNullableTernaryGuard(ast)).toBe(true)
            })

            it('should reject ast nodes that do not match the ternary guard structure', () => {
                expect(isNullableTernaryGuard(null)).toBe(false)
                expect(isNullableTernaryGuard({})).toBe(false)
                expect(isNullableTernaryGuard({ kind: 'binary_expression' })).toBe(false)
                expect(isNullableTernaryGuard({
                    kind: 'ternary',
                    falsy: { kind: 'primitive', type: 'string' },
                })).toBe(false)
            })
        })

        describe('toFieldResolutionMeta Complete Contract', () => {
            it('should create complete, non-nullable guaranteed metadata', () => {
                const meta = toFieldResolutionMeta({
                    type: 'varchar',
                    nullable: true,
                })
                expect(meta.type).toBe('varchar')
                expect(meta.cast).toBeUndefined()
                expect(meta.nullable).toBe(true)
                expect(Object.isFrozen(meta)).toBe(true)
            })

            it('should default empty or invalid fields safely', () => {
                const meta = toFieldResolutionMeta({})
                expect(meta.type).toBe('unknown')
                expect(meta.cast).toBeUndefined()
                expect(meta.nullable).toBe(false)
            })
        })
    })

    describe('SemanticResolver.resolve() Full Pipeline', () => {
        it('should resolve responses, model columns, and resource fields into CompilerIR', () => {
            const manifest: any = {
                version: '1.0',
                routes: [
                    {
                        name: 'orders.show',
                        method: 'GET',
                        path: '/api/orders/{id}',
                        response: {
                            kind: 'resource',
                            resource: 'OrderResource',
                            collection: false,
                            paginated: false,
                        },
                    },
                    {
                        name: 'orders.store',
                        method: 'POST',
                        path: '/api/orders',
                        response: {
                            kind: 'resource',
                            resource: 'OrderResource',
                        },
                    },
                ],
                models: [
                    {
                        name: 'Order',
                        table: 'orders',
                        columns: [
                            { name: 'id', type: 'bigint', nullable: false },
                            { name: 'total', type: 'decimal(10,2)', nullable: false },
                        ],
                        casts: {},
                    },
                ],
                resources: [
                    {
                        name: 'OrderResource',
                        fields: {
                            id: { kind: 'primitive', type: 'bigint' },
                            total: {
                                kind: 'raw_code',
                                parsed_ast: {
                                    kind: 'property_access',
                                    target: { kind: 'variable', name: 'this' },
                                    property: 'total',
                                },
                            },
                        },
                    },
                ],
            }

            const ir = SemanticResolver.resolve(manifest)
            expect(ir.responseTypes.size).toBe(2)
            expect(ir.resolvedRoutes).toHaveLength(2)

            const showResp = ir.responseTypes.get('orders.showResponse')!
            expect(showResp.name).toBe('OrderResource')
            expect(showResp.contractName).toBe('OrderResourceSchema')
            expect(showResp.mapperName).toBe('toOrderResourceRead')
            expect(showResp.formMapperName).toBe('toApiOrderResourceGet')

            const storeResp = ir.responseTypes.get('orders.storeResponse')!
            expect(storeResp.formMapperName).toBe('toApiOrderResourceCreate')

            // Verify field mappings
            expect(ir.fieldMappings.has('Order.id')).toBe(true)
            expect(ir.fieldMappings.get('Order.id')?.zodType).toBe('z.number()')

            expect(ir.fieldMappings.has('OrderResource.total')).toBe(true)
            expect(ir.fieldMappings.get('OrderResource.total')?.sourceType).toBe('sql')

            // Verify group counts
            expect(ir.responseCountByGroup.size).toBeGreaterThan(0)
            expect(ir.metadata.errors).toHaveLength(0)
        })

        it('should resolve nested recursive resource fields', () => {
            const manifest: any = {
                version: '1.0',
                routes: [
                    {
                        name: 'checkout.get',
                        method: 'GET',
                        path: '/api/checkout',
                        response: {
                            kind: 'resource',
                            resource: 'CheckoutResource',
                        },
                    },
                ],
                models: [],
                resources: [
                    {
                        name: 'CheckoutResource',
                        fields: {
                            summary: {
                                kind: 'object',
                                fields: {
                                    tax: { kind: 'primitive', type: 'number' },
                                    discount: { kind: 'primitive', type: 'number' },
                                },
                            },
                        },
                    },
                ],
            }

            const ir = SemanticResolver.resolve(manifest)
            expect(ir.fieldMappings.has('CheckoutResource.summary.tax')).toBe(true)
            expect(ir.fieldMappings.has('CheckoutResource.summary.discount')).toBe(true)
            expect(ir.fieldMappings.get('CheckoutResource.summary.tax')?.zodType).toBe('z.number()')
        })
    })
})
