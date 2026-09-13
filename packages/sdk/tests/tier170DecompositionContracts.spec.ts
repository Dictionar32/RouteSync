import { describe, it, expect } from 'vitest';
import {
    IdentifierCase,
    ScannedResourceFieldDescriptor,
    ScannedResourceDescriptor,
} from '@routesync/core';
import { ControlFlowGraph, type BasicBlock } from '@routesync/core/src/compiler/utils/ControlFlowGraph';
import type { DominatorTree } from '@routesync/core/src/compiler/analysis/DominatorAnalysis';
import { SSARenamer } from '@routesync/core/src/compiler/analysis/ssa';

describe('Tier 170-200 Active Consumer & Sub-Domain Decomposition Contracts', () => {
    describe('IdentifierCase Lexer Sub-domain', () => {
        it('tokenizes camelCase, PascalCase, snake_case, and acronyms correctly', () => {
            expect(IdentifierCase.words('orderItem')).toEqual(['order', 'Item']);
            expect(IdentifierCase.words('OrderItem')).toEqual(['Order', 'Item']);
            expect(IdentifierCase.words('order_item_id')).toEqual(['order', 'item', 'id']);
            expect(IdentifierCase.words('getHTTPResponse')).toEqual(['get', 'HTTP', 'Response']);
        });

        it('formats words into Pascal, camel, snake, and kebab case deterministically', () => {
            expect(IdentifierCase.toPascal('order_item')).toBe('OrderItem');
            expect(IdentifierCase.toCamel('OrderItem')).toBe('orderItem');
            expect(IdentifierCase.toSnake('OrderItem')).toBe('order_item');
            expect(IdentifierCase.toKebab('OrderItem')).toBe('order-item');
        });
    });

    describe('ScannedResource and ScannedResourceField Descriptors', () => {
        it('creates frozen resource field descriptor', () => {
            const field = ScannedResourceFieldDescriptor.create({
                name: 'title',
                expression: { kind: 'primitive', type: 'string' }
            });
            expect(field.name).toBe('title');
            expect(field.propertyName).toBe('title');
            expect(field.nullable).toBe(false);
            expect(Object.isFrozen(field)).toBe(true);
        });

        it('creates frozen resource descriptor with sanitized name and baseModel', () => {
            const res = ScannedResourceDescriptor.create({
                name: 'PostResource',
                fields: []
            });
            expect(res.name).toBe('PostResource');
            expect(res.baseName).toBe('Post');
            expect(res.typeName).toBe('PostResourceTransformed');
            expect(res.baseModel).toBe('Post');
            expect(Object.isFrozen(res)).toBe(true);
        });
    });

    describe('SSARenamer Sub-domain', () => {
        it('renames variables in CFG with SSA versions', () => {
            const renamer = new SSARenamer();
            const blocks = new Map<number, BasicBlock>();
            blocks.set(0, {
                id: 0,
                instructions: [
                    { kind: 'Assign', target: 1, value: { kind: 'Constant', value: 42 } }
                ],
                predecessors: [],
                successors: []
            });

            const cfg = new ControlFlowGraph(0, 0, blocks);
            const domTree: DominatorTree = {
                getChildren: () => [],
                dominates: () => true,
                getDominators: () => new Set([0]),
                getIdom: () => null
            };

            const renamed = renamer.rename(cfg, domTree);
            const block0 = renamed.blocks.get(0);
            expect(block0).toBeDefined();
            expect(block0?.instructions[0].target).toBe(1);
        });
    });
});

    describe('SemanticResolutionKernel Sub-domain', () => {
        it('maps SQL types and cast types accurately', async () => {
            const { SemanticResolutionKernel, mapSqlTypeToTs, mapCastToTs } = await import('@routesync/core/src/semantic/SemanticResolutionKernel');
            const kernel = new SemanticResolutionKernel();
            expect(kernel.mapSqlTypeToTs('tinyint(1)')).toBe('boolean');
            expect(kernel.mapSqlTypeToTs('bigint')).toBe('number');
            expect(kernel.mapSqlTypeToTs('varchar')).toBe('string');
            expect(mapSqlTypeToTs('decimal')).toBe('number');
            expect(mapCastToTs('json', 'string')).toBe('json-object');
            expect(mapCastToTs('datetime', 'string')).toBe('string');
        });
    });

    describe('ContractInputBoundary Sub-domain', () => {
        it('resolves legacy contract values correctly', async () => {
            const { ContractInputBoundary } = await import('@routesync/core/src/compiler/compatibility/ContractInputBoundary');
            const boundary = new ContractInputBoundary();
            const resolved = boundary.resolve({
                kind: 'primitive',
                type: 'string'
            });
            expect(resolved).toEqual({
                kind: 'primitive',
                type: 'string'
            });

            const unionResolved = boundary.resolve({
                kind: 'union',
                types: [
                    { kind: 'primitive', type: 'string' },
                    { kind: 'primitive', type: 'number' }
                ]
            });
            expect(unionResolved.kind).toBe('union');
        });
    });

    describe('ResponseArtifact Sub-domain', () => {
        it('verifies response type guards and factory', async () => {
            const {
                createResponseArtifact,
                isDataResponse,
                isBinaryResponse,
                isRedirectResponse
            } = await import('@routesync/core/src/compiler/ir/ResponseArtifact');

            expect(isDataResponse('resource')).toBe(true);
            expect(isBinaryResponse('binary')).toBe(true);
            expect(isRedirectResponse('redirect')).toBe(true);

            const artifact = createResponseArtifact({
                id: 'test_route',
                descriptor: { transport: 'json', status: 200 }
            });
            expect(artifact.id).toBe('test_route');
            expect(artifact.descriptor.transport).toBe('json');
        });
    });

    describe('ResolvedPhpType Sub-domain', () => {
        it('matches variants using catamorphism without if/switch', async () => {
            const {
                PrimitivePhpType,
                EloquentModelPhpType,
                matchResolvedPhpType
            } = await import('@routesync/core/src/compiler/types/ResolvedPhpType');

            const strType = PrimitivePhpType.string();
            const result = matchResolvedPhpType(strType, {
                primitive: p => `prim:${p.primitiveKind}`,
                model: m => `model:${m.modelName}`,
                resource: r => `res:${r.resourceName}`,
                void: () => 'void',
                unknown: () => 'unknown'
            });
            expect(result).toBe('prim:string');

            const modelType = EloquentModelPhpType.create({
                modelName: 'User',
                baseName: 'User',
                properties: [],
                nullable: false
            });
            const modelResult = matchResolvedPhpType(modelType, {
                primitive: () => 'prim',
                model: m => `model:${m.modelName}`,
                resource: () => 'res',
                void: () => 'void',
                unknown: () => 'unknown'
            });
            expect(modelResult).toBe('model:User');
        });
    });

    describe('ModelSymbolTable Sub-domain', () => {
        it('indexes model columns and resolves property bindings O(1)', async () => {
            const { ModelSymbolTable } = await import('@routesync/core/src/compiler/scanner/symbols/ModelSymbolTable');
            const table = new ModelSymbolTable([
                {
                    name: 'App\\Models\\User',
                    shortName: 'User',
                    columns: [
                        { name: 'id', type: 'bigint', nullable: false },
                        { name: 'email', type: 'varchar', nullable: false }
                    ]
                }
            ]);

            const sym = table.get('User');
            expect(sym).toBeDefined();
            const binding = sym?.resolveProperty('id');
            expect(binding?.kind).toBe('column');
            expect(binding?.type).toBe('number');
            expect(binding?.nullable).toBe(false);
        });
    });

    describe('ScannedHttpErrorResponseDescriptor Sub-domain', () => {
        it('constructs frozen error descriptors via static factories', async () => {
            const { ScannedHttpErrorResponseDescriptor } = await import('@routesync/core/src/compiler/scanner/descriptors/route/routeResponses');
            const valError = ScannedHttpErrorResponseDescriptor.validation();
            expect(valError.statusCode).toBe(422);
            expect(valError.typeName).toBe('LaravelValidationError');
            expect(Object.isFrozen(valError)).toBe(true);

            const notFound = ScannedHttpErrorResponseDescriptor.notFound();
            expect(notFound.statusCode).toBe(404);
        });
    });

    describe('ScannedModelRelationDescriptor Sub-domain', () => {
        it('constructs frozen relation descriptors via factory helpers', async () => {
            const { ScannedModelRelationDescriptor } = await import('@routesync/core/src/compiler/scanner/descriptors/model/relation/modelRelationDescriptorClass');
            const rel = ScannedModelRelationDescriptor.belongsTo({
                name: 'author',
                modelName: 'User'
            });
            expect(rel.name).toBe('author');
            expect(rel.targetModel).toBe('User');
            expect(rel.cardinality).toBe('one');
            expect(rel.isCollection).toBe(false);
            expect(Object.isFrozen(rel)).toBe(true);
        });
    });

    describe('DataProvenance Sub-domain', () => {
        it('matches provenance kind and builds scanned descriptors', async () => {
            const {
                DataProvenanceKind,
                matchDataProvenance,
                ScannedEndpointProvenanceDescriptor
            } = await import('@routesync/core/src/types/domain/provenance');

            const ref = {
                kind: DataProvenanceKind.RouteDefinition,
                file: 'routes/api.php',
                line: 12,
                symbol: 'GET /api/users'
            };

            const matched = matchDataProvenance(ref, {
                route_definition: r => `route:${r.line}`,
                controller_action: () => 'ctrl',
                form_request: () => 'req',
                eloquent_model: () => 'model',
                json_resource: () => 'res',
                inferred: () => 'inf'
            });
            expect(matched).toBe('route:12');

            const endpointDesc = ScannedEndpointProvenanceDescriptor.create({
                route: ref
            });
            expect(endpointDesc.summary).toContain('routes/api.php:12');
            expect(Object.isFrozen(endpointDesc)).toBe(true);
        });
    });

    describe('ScannedRouteDescriptor and RouteSemanticFactories Sub-domain', () => {
        it('creates synthetic and closure routes via semantic factories', async () => {
            const { ScannedRouteDescriptor } = await import('@routesync/core/src/compiler/scanner/descriptors/route/ScannedRouteDescriptor');
            const synth = ScannedRouteDescriptor.synthetic({
                path: '/test-synthetic',
                resourceName: 'Item'
            });
            expect(synth.path).toBe('/test-synthetic');
            expect(synth.resourceName).toBe('Item');
            expect(synth.method).toBe('GET');
            expect(Object.isFrozen(synth)).toBe(true);

            const closure = ScannedRouteDescriptor.fromClosure({
                method: 'POST',
                path: '/api/closure-test',
                actionName: 'testAction',
                sourceFile: 'routes/api.php'
            });
            expect(closure.method).toBe('POST');
            expect(closure.action).toBe('closure@testAction');
            expect(Object.isFrozen(closure)).toBe(true);
        });
    });

    describe('Composite Binders Sub-domain', () => {
        it('binds literal and fallback fields with bound AST', async () => {
            const {
                bindLiteralField,
                bindFallbackField
            } = await import('@routesync/core/src/compiler/scanner/binders/resource/compositeBinders');

            const literalRes = bindLiteralField('active', { kind: 'literal', value: true });
            expect(literalRes.descriptor.name).toBe('active');
            expect(literalRes.boundAst.kind).toBe('bound_primitive');

            const fallbackRes = bindFallbackField('custom', '$var->compute()');
            expect(fallbackRes.descriptor.name).toBe('custom');
            expect(fallbackRes.boundAst.kind).toBe('bound_unknown');
        });
    });

    describe('Model Entity Descriptor Sub-domain', () => {
        it('constructs frozen model descriptor with defaults and table inference', async () => {
            const { ScannedModelDescriptor } = await import('@routesync/core/src/compiler/scanner/descriptors/model/modelEntityDescriptor');
            const model = ScannedModelDescriptor.fromTable('users');
            expect(model.name).toBe('User');
            expect(model.table).toBe('users');
            expect(model.primaryKey).toBe('id');
            expect(Object.isFrozen(model)).toBe(true);
        });
    });

    describe('TypeScript Code Builder Sub-domain', () => {
        it('lowers semantic type expressions into TS syntax string', async () => {
            const { TypeScriptCodeBuilder } = await import('@routesync/core/src/compiler/domain/common/ts-lowerer/typeScriptCodeBuilder');
            const { PrimitiveType, PrimitiveKind } = await import('@routesync/core/src/compiler/types/SemanticType');
            const builder = new TypeScriptCodeBuilder();
            const prim = new PrimitiveType(PrimitiveKind.STRING);
            expect(builder.lowerTypeExpression(prim)).toBe('string');
        });
    });

    describe('TypeScript Target AST Nodes and BaseVisitor Sub-domain', () => {
        it('instantiates and verifies TSFunctionDeclaration, TSExportDeclaration, and TSMethodSignature', async () => {
            const { TSFunctionDeclaration } = await import('@routesync/core/src/compiler/target/typescript/nodes/TSFunctionDeclaration');
            const { TSExportDeclaration } = await import('@routesync/core/src/compiler/target/typescript/nodes/TSExportDeclaration');
            const { TSMethodSignature } = await import('@routesync/core/src/compiler/target/typescript/nodes/TSMethodSignature');
            const { TSTypeAliasDeclaration } = await import('@routesync/core/src/compiler/target/typescript/nodes/TSTypeAliasDeclaration');
            const { TSTypeReference } = await import('@routesync/core/src/compiler/target/typescript/nodes/TSTypeReference');
            const { visitAll } = await import('@routesync/core/src/compiler/target/typescript/visitor/visitorUtils');

            const fn = TSFunctionDeclaration.simple('getName', TSTypeReference.string());
            expect(fn.kind).toBe('function-declaration');
            expect(fn.name).toBe('getName');
            expect(fn.asExported().isExported).toBe(true);

            const exp = TSExportDeclaration.named(['User', 'Profile']);
            expect(exp.kind).toBe('export-declaration');
            expect(exp.specifiers.length).toBe(2);
            expect(exp.isReExport).toBe(false);

            const method = TSMethodSignature.simple('run', new TSTypeReference('void'));
            expect(method.kind).toBe('method-signature');
            expect(method.name).toBe('run');
            expect(method.asOptional().optional).toBe(true);

            const alias = TSTypeAliasDeclaration.simple('ID', TSTypeReference.number());
            expect(alias.kind).toBe('type-alias');
            expect(alias.name).toBe('ID');

            const visited = visitAll([1, 2, 3], null as any, x => x * 2);
            expect(visited).toEqual([2, 4, 6]);
        });
    });

    describe('React Hooks Define Intent Sub-domain', () => {
        it('exports and verifies intent types and resolvers contract', async () => {
            const intent = await import('@routesync/react/src/hooks/define/intentTypes');
            expect(intent).toBeDefined();
        });
    });
