import { describe, it, expect } from 'vitest';
import {
    SemanticTypeDeriver,
    SemanticDerivationContext,
    PrimitiveKind,
    ObjectType,
    ReadonlyCollectionType,
    NullableType,
    ResolvedPhpType,
    PrimitivePhpType,
    EloquentModelPhpType,
    ResourceWrapperPhpType,
    VoidPhpType,
    UnknownPhpType,
    matchResolvedPhpType,
    ScannedModelDescriptor,
    ScannedResourceDescriptor,
    ScannedResourceFieldDescriptor,
    ScannedRouteDescriptor
} from '@routesync/core';

describe('SemanticTypeDeriver Complete Contract & ResolvedPhpType ADT', () => {
    describe('1. ResolvedPhpType TTD ADT & Catamorphism', () => {
        it('instantiates PrimitivePhpType with Complete Contract (0 ?) and Object.freeze', () => {
            const prim = PrimitivePhpType.create(PrimitiveKind.NUMBER, false);
            expect(prim.kind).toBe('primitive');
            expect(prim.primitiveKind).toBe(PrimitiveKind.NUMBER);
            expect(prim.nullable).toBe(false);
            expect(Object.isFrozen(prim)).toBe(true);

            // Mutation throws in strict mode
            expect(() => {
                (prim as any).nullable = true;
            }).toThrow();
        });

        it('instantiates EloquentModelPhpType with Complete Contract', () => {
            const model = EloquentModelPhpType.create({
                modelName: 'App\\Models\\Product',
                baseName: 'Product',
                properties: [],
                nullable: false
            });
            expect(model.kind).toBe('model');
            expect(model.baseName).toBe('Product');
            expect(Object.isFrozen(model)).toBe(true);
        });

        it('instantiates ResourceWrapperPhpType with Complete Contract', () => {
            const res = ResourceWrapperPhpType.create({
                resourceName: 'UserResource',
                targetTypeName: 'UserTransformed',
                isCollection: true,
                nullable: false
            });
            expect(res.kind).toBe('resource');
            expect(res.isCollection).toBe(true);
            expect(Object.isFrozen(res)).toBe(true);
        });

        it('instantiates VoidPhpType and UnknownPhpType correctly', () => {
            const voidType = VoidPhpType.create();
            expect(voidType.kind).toBe('void');
            expect(Object.isFrozen(voidType)).toBe(true);

            const unknownType = UnknownPhpType.create('$complex->call()', true);
            expect(unknownType.kind).toBe('unknown');
            expect(unknownType.rawExpression).toBe('$complex->call()');
            expect(unknownType.nullable).toBe(true);
            expect(Object.isFrozen(unknownType)).toBe(true);
        });

        it('dispatches exhaustively via matchResolvedPhpType catamorphism (0 if, 0 switch at caller)', () => {
            const types: ResolvedPhpType[] = [
                PrimitivePhpType.string(),
                EloquentModelPhpType.create({
                    modelName: 'User',
                    baseName: 'User',
                    properties: [],
                    nullable: false
                }),
                ResourceWrapperPhpType.create({
                    resourceName: 'UserResource',
                    targetTypeName: 'UserTransformed',
                    isCollection: false,
                    nullable: false
                }),
                VoidPhpType.create(),
                UnknownPhpType.create('expr', false)
            ];

            const kinds = types.map(t =>
                matchResolvedPhpType(t, {
                    primitive: p => `primitive:${p.primitiveKind}`,
                    model: m => `model:${m.baseName}`,
                    resource: r => `resource:${r.resourceName}`,
                    void: () => 'void',
                    unknown: u => `unknown:${u.rawExpression}`
                })
            );

            expect(kinds).toEqual([
                'primitive:string',
                'model:User',
                'resource:UserResource',
                'void',
                'unknown:expr'
            ]);
        });
    });

    describe('2. SemanticDerivationContext Origin Boundary', () => {
        it('creates a frozen context with default fallback values (0 crash on undefined)', () => {
            const ctx = SemanticDerivationContext.create();
            expect(ctx.resources).toEqual([]);
            expect(ctx.models).toEqual([]);
            expect(ctx.routes).toEqual([]);
            expect(ctx.interner).toBeDefined();
            expect(Object.isFrozen(ctx)).toBe(true);
            expect(Object.isFrozen(ctx.resources)).toBe(true);
            expect(Object.isFrozen(ctx.models)).toBe(true);
        });

        it('indexes models by exact and lowercase name for O(1) lookup', () => {
            const ctx = SemanticDerivationContext.create(
                [],
                [
                ScannedModelDescriptor.create({
                    name: 'App\\Models\\Order',
                    table: 'orders',
                    columns: []
                })
            ]
            );
            expect(ctx.modelsByName.get('App\\Models\\Order')).toBeDefined();
            expect(ctx.modelsByName.get('app\\models\\order')).toBeDefined();
        });
    });

    describe('3. SemanticTypeDeriver Complete Contract & Stream Lowering', () => {
        it('executes cleanly with empty context returning empty array', () => {
            const deriver = SemanticTypeDeriver.create(SemanticDerivationContext.empty());
            expect(Object.isFrozen(deriver)).toBe(true);
            const output = deriver.run();
            expect(output).toEqual([]);
        });

        it('derives resource object types with correct property types and nullability', () => {
            const mockResource = ScannedResourceDescriptor.create({
                name: 'ProductResource',
                fields: [
                    ScannedResourceFieldDescriptor.create({ name: 'id', expression: { kind: 'primitive', type: 'int' } }),
                    ScannedResourceFieldDescriptor.create({ name: 'title', expression: { kind: 'primitive', type: 'string' } }),
                    ScannedResourceFieldDescriptor.create({ name: 'description', nullable: true, expression: { kind: 'primitive', type: 'string' } })
                ]
            });

            const types = SemanticTypeDeriver.derive([mockResource]);
            expect(types.length).toBe(1);

            const productType = types[0];
            expect(productType).toBeInstanceOf(ObjectType);
            expect(productType.name).toBe('ProductResourceTransformed');
            expect(productType.properties.length).toBe(3);

            const descProp = productType.properties.find(p => p.name === 'description');
            expect(descProp).toBeDefined();
            expect(descProp?.nullable).toBe(true);
            expect(descProp?.type).toBeInstanceOf(NullableType);
        });

        it('derives model object types with casts and accessors', () => {
            const mockModel = ScannedModelDescriptor.create({
                name: 'User',
                table: 'users',
                columns: [
                    { name: 'id', type: 'bigint', nullable: false, semanticType: PrimitiveKind.NUMBER },
                    { name: 'is_active', type: 'tinyint', nullable: false, semanticType: PrimitiveKind.NUMBER }
                ],
                casts: [
                    { column: 'is_active', targetType: 'boolean', semanticType: PrimitiveKind.BOOLEAN }
                ],
                accessors: [
                    { name: 'full_name', propertyName: 'fullName', type: 'string', nullable: false, targetType: 'string', semanticType: PrimitiveKind.STRING }
                ],
                appends: ['full_name']
            });

            const types = SemanticTypeDeriver.derive([], [mockModel]);
            expect(types.length).toBe(1);

            const userType = types[0];
            expect(userType.name).toBe('UserTransformed');
            expect(userType.properties.length).toBe(3);

            const activeProp = userType.properties.find(p => p.name === 'isActive');
            expect(activeProp).toBeDefined();

            const fullNameProp = userType.properties.find(p => p.name === 'fullName');
            expect(fullNameProp).toBeDefined();
            expect(fullNameProp?.nullable).toBe(false);
        });

        it('derives inline response types from routes', () => {
            const mockRoute = ScannedRouteDescriptor.fromSparse({
                method: 'GET',
                path: '/api/stats',
                actionName: 'StatsController@index',
                response: {
                    kind: 'inline',
                    typeName: 'StatsResponseTransformed',
                    baseName: 'StatsResponse',
                    fields: [
                        { name: 'total_revenue', semanticType: 'number', nullable: false },
                        { name: 'total_orders', semanticType: 'number', nullable: false }
                    ]
                }
            });

            const types = SemanticTypeDeriver.derive([], [], undefined, [mockRoute]);
            expect(types.length).toBe(1);
            expect(types[0].name).toBe('StatsResponseTransformed');
            expect(types[0].properties.length).toBe(2);
            expect(types[0].properties[0].name).toBe('totalRevenue');
            expect(types[0].properties[1].name).toBe('totalOrders');
        });
    });
});
