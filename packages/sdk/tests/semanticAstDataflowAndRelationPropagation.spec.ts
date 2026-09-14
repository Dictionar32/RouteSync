import { describe, it, expect, vi } from 'vitest';
import {
    ResourceModelResolver,
    ModelSymbolTable,
    SemanticResourceBinder,
    OriginModelSymbol,
    ParsedModel,
    matchResourceModelBinding,
    ResourceModelBindingFactory
} from '@routesync/core';
import { scanControllerAction } from '../../core/src/compiler/scanner/subscanners/controller/actionScanner';
import { LaravelSourceLexer } from '../../core/src/compiler/scanner/LaravelSourceLexer';

describe('Semantic AST Dataflow, Relation Propagation & Structural Type Inference', () => {
    const orderDetailModel: ParsedModel = {
        name: 'App\\Models\\OrderDetail',
        shortName: 'OrderDetail',
        table: 'order_details',
        primaryKey: 'id',
        keyType: 'int',
        keySemanticType: 'number' as any,
        incrementing: true,
        softDeletes: false,
        timestamps: true,
        columns: [
            { name: 'id', type: 'bigint', nullable: false, isPrimary: true },
            { name: 'order_id', type: 'bigint', nullable: false, isPrimary: false },
            { name: 'produk_id', type: 'bigint', nullable: false, isPrimary: false },
            { name: 'qty', type: 'int', nullable: false, isPrimary: false },
            { name: 'harga', type: 'decimal', nullable: false, isPrimary: false },
            { name: 'subtotal', type: 'decimal', nullable: false, isPrimary: false }
        ],
        fillable: ['order_id', 'produk_id', 'qty', 'harga', 'subtotal'],
        guarded: [],
        hidden: [],
        appends: [],
        casts: [],
        accessors: [],
        relations: []
    };

    const orderModel: ParsedModel = {
        name: 'App\\Models\\Order',
        shortName: 'Order',
        table: 'orders',
        primaryKey: 'id',
        keyType: 'int',
        keySemanticType: 'number' as any,
        incrementing: true,
        softDeletes: false,
        timestamps: true,
        columns: [
            { name: 'id', type: 'bigint', nullable: false, isPrimary: true },
            { name: 'user_id', type: 'bigint', nullable: false, isPrimary: false },
            { name: 'total_amount', type: 'decimal', nullable: false, isPrimary: false },
            { name: 'status', type: 'string', nullable: false, isPrimary: false }
        ],
        fillable: ['user_id', 'total_amount', 'status'],
        guarded: [],
        hidden: [],
        appends: [],
        casts: [],
        accessors: [],
        relations: [
            {
                name: 'items',
                targetModel: 'OrderDetail',
                relationType: 'hasMany',
                foreignKey: 'order_id',
                localKey: 'id',
                isCollection: true
            }
        ]
    };

    const table = new ModelSymbolTable([orderModel, orderDetailModel]);

    describe('Tier 1: Controller AST Dataflow & First-Argument Extraction', () => {
        it('tracks parameter model type-hint with multi-arity constructor arguments', () => {
            const phpSource = `
            public function show(Order $order)
            {
                return new CustomPesananResource($order, true);
            }
            `;
            const tokens = LaravelSourceLexer.tokenize(phpSource);
            const actionIdx = tokens.findIndex(t => t.value === 'function');
            const result = scanControllerAction(
                phpSource,
                tokens,
                actionIdx,
                'OrderController',
                '/app/Http/Controllers/OrderController.php',
                new Map()
            );

            expect(result).toBeDefined();
            expect(result?.descriptor.resourceModelMap?.get('CustomPesananResource')).toBe('Order');
        });

        it('tracks local variable assignment chain from Eloquent query builder', () => {
            const phpSource = `
            public function index()
            {
                $query = Order::query();
                $orders = $query->paginate(15);
                return CustomPesananResource::collection($orders);
            }
            `;
            const tokens = LaravelSourceLexer.tokenize(phpSource);
            const actionIdx = tokens.findIndex(t => t.value === 'function');
            const result = scanControllerAction(
                phpSource,
                tokens,
                actionIdx,
                'OrderController',
                '/app/Http/Controllers/OrderController.php',
                new Map()
            );

            expect(result).toBeDefined();
            expect(result?.descriptor.resourceModelMap?.get('CustomPesananResource')).toBe('Order');
        });

        it('tracks DB::table query builder and maps table name to Model via byTableName', () => {
            const phpSource = `
            public function recentOrders()
            {
                $data = DB::table('orders')->get();
                return CustomPesananResource::collection($data);
            }
            `;
            const tokens = LaravelSourceLexer.tokenize(phpSource);
            const actionIdx = tokens.findIndex(t => t.value === 'function');
            const result = scanControllerAction(
                phpSource,
                tokens,
                actionIdx,
                'OrderController',
                '/app/Http/Controllers/OrderController.php',
                new Map()
            );

            expect(result).toBeDefined();
            expect(result?.descriptor.resourceModelMap?.get('CustomPesananResource')).toBe('table:orders');

            // Verify ResourceModelResolver resolves table:orders to Order
            const binding = ResourceModelResolver.resolve({
                resourceName: 'CustomPesananResource',
                fieldNames: [],
                modelSymbolTable: table,
                controllerDataflowMap: result?.descriptor.resourceModelMap
            });

            expect(binding.kind).toBe('mono');
            if (binding.kind === 'mono') {
                expect(binding.model.shortName).toBe('Order');
                expect(binding.source).toBe('controller_dataflow');
            }
        });

        it('detects resources wrapped inside response()->json(...)', () => {
            const phpSource = `
            public function viewJson(Order $order)
            {
                return response()->json(new CustomPesananResource($order), 200);
            }
            `;
            const tokens = LaravelSourceLexer.tokenize(phpSource);
            const actionIdx = tokens.findIndex(t => t.value === 'function');
            const result = scanControllerAction(
                phpSource,
                tokens,
                actionIdx,
                'OrderController',
                '/app/Http/Controllers/OrderController.php',
                new Map()
            );

            expect(result).toBeDefined();
            expect(result?.descriptor.resourceModelMap?.get('CustomPesananResource')).toBe('Order');
        });
    });

    describe('Tier 2: Relation Graph Propagation', () => {
        it('resolves child resource model via parent relation propagation map', () => {
            const relationPropagationMap = new Map<string, string>([
                ['ChildItemsResource', 'OrderDetail']
            ]);

            const binding = ResourceModelResolver.resolve({
                resourceName: 'ChildItemsResource',
                fieldNames: [],
                modelSymbolTable: table,
                relationPropagationMap
            });

            expect(binding.kind).toBe('mono');
            if (binding.kind === 'mono') {
                expect(binding.model.shortName).toBe('OrderDetail');
                expect(binding.source).toBe('relation_propagation');
            }
        });
    });

    describe('Tier 4: Weighted Structural Type Unification', () => {
        it('matches model with distinctive domain columns over generic columns', () => {
            // Field names specific to OrderDetail
            const fields = ['order_id', 'produk_id', 'qty', 'harga', 'subtotal'];

            const binding = ResourceModelResolver.resolve({
                resourceName: 'UnconventionalDetailResource', // Name does not hint OrderDetail
                fieldNames: fields,
                modelSymbolTable: table
            });

            expect(binding.kind).toBe('mono');
            if (binding.kind === 'mono') {
                expect(binding.model.shortName).toBe('OrderDetail');
                expect(binding.source).toBe('structural');
            }
        });

        it('does not falsely match when only generic columns match', () => {
            // Only generic columns present, no distinctive domain columns
            const fields = ['id', 'status'];

            const binding = ResourceModelResolver.resolve({
                resourceName: 'GenericStatusDtoResource',
                fieldNames: fields,
                modelSymbolTable: table
            });

            // Must NOT guess an arbitrary model; should be classified as DTO
            expect(binding.kind).toBe('unbacked_dto');
        });
    });

    describe('Tier 5: Unbacked DTO Classification', () => {
        it('classifies completely unbacked payload as DTO with compiler warning', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const res = SemanticResourceBinder.bindResource({
                resourceName: 'AuthenticationResponseResource',
                entries: [
                    { key: 'access_token', value: { kind: 'literal', literalType: 'string', value: 'xyz' }, rawExpression: "'xyz'" },
                    { key: 'expires_in', value: { kind: 'literal', literalType: 'number', value: 3600 }, rawExpression: '3600' }
                ],
                sourceFile: '/app/Http/Resources/AuthenticationResponseResource.php',
                modelSymbolTable: table
            });

            expect(res.modelName).toBeNull();
            expect(res.baseModel).toBeNull();
            expect(res.isSynthetic).toBe(true);

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining("[RouteSync Compiler Warning] Resource 'AuthenticationResponseResource' is a DTO")
            );

            warnSpy.mockRestore();
        });
    });

    describe('Catamorphic Eliminator matchResourceModelBinding', () => {
        it('folds ADT variants with 0 if/switch', () => {
            const monoBinding = ResourceModelBindingFactory.mono(table.get('Order')!, 'controller_dataflow');
            const result = matchResourceModelBinding(monoBinding, {
                mono: (b) => `MONO:${b.model.shortName}:${b.source}`,
                poly: (b) => `POLY:${b.models.length}`,
                unbacked_dto: (b) => `DTO:${b.reason}`
            });

            expect(result).toBe('MONO:Order:controller_dataflow');
        });
    });
});
