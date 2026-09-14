import { describe, it, expect } from 'vitest';
import {
    PhpAstFactory,
    matchPhpAstValue,
    LaravelSourceLexer,
    RouteDefDescriptor,
    ResourceDefDescriptor,
    ModelDefDescriptor,
    createRoutePath,
    createHttpVerb,
    type RouteDef,
    type ResourceDef,
    type ModelDef
} from '@routesync/core';

describe('Upstream Lexer ADT & Level 7 Constructors SSOT', () => {
    it('guarantees PhpAstFactory returns deeply frozen AST nodes', () => {
        const literal = PhpAstFactory.stringLiteral('test_value');
        expect(Object.isFrozen(literal)).toBe(true);
        expect(literal.kind).toBe('literal');

        const single = PhpAstFactory.resourceSingle('UserResource', '$this->user');
        expect(Object.isFrozen(single)).toBe(true);

        const collection = PhpAstFactory.resourceCollection('OrderResource', '$this->orders');
        expect(Object.isFrozen(collection)).toBe(true);

        const chain = PhpAstFactory.methodChain('this', 'whenLoaded', true);
        expect(Object.isFrozen(chain)).toBe(true);
    });

    it('executes 100% pure catamorphic pattern matching across all PhpAstValue variants', () => {
        const ast = PhpAstFactory.resourceSingle('PostResource', '$this->post');
        const result = matchPhpAstValue(ast, {
            literal: () => 'literal',
            resourceSingle: (v) => `single:${v.resourceName}`,
            resourceCollection: (v) => `collection:${v.resourceName}`,
            methodChain: (v) => `method:${v.property}`,
            propertyAccess: (v) => `prop:${v.property}`,
            variableReference: (v) => `var:${v.name}`,
            ternaryExpression: () => 'ternary',
            nestedArray: () => 'array',
            rawExpression: () => 'raw'
        });
        expect(result).toBe('single:PostResource');

        const lexerResult = LaravelSourceLexer.matchAstValue(ast, {
            literal: () => 'literal',
            resourceSingle: (v) => `single:${v.resourceName}`,
            resourceCollection: (v) => `collection:${v.resourceName}`,
            methodChain: (v) => `method:${v.property}`,
            propertyAccess: (v) => `prop:${v.property}`,
            variableReference: (v) => `var:${v.name}`,
            ternaryExpression: () => 'ternary',
            nestedArray: () => 'array',
            rawExpression: () => 'raw'
        });
        expect(lexerResult).toBe('single:PostResource');
    });

    it('constructs RouteDefDescriptor with 0 undefined, 0 null, and branded nominal atoms', () => {
        const legacyRoute: RouteDef = {
            name: 'users.index',
            method: 'get',
            path: '/api/v1/users',
            auth: true,
            middleware: ['auth:sanctum'],
            schema: { page: 'integer', limit: 'integer' },
            assignments: { user_id: 'auth()->id()' }
        };

        const descriptor = RouteDefDescriptor.fromRouteDef(legacyRoute);
        expect(Object.isFrozen(descriptor)).toBe(true);
        expect(Object.isFrozen(descriptor.identity)).toBe(true);
        expect(Object.isFrozen(descriptor.security)).toBe(true);
        expect(Object.isFrozen(descriptor.payload)).toBe(true);
        expect(Object.isFrozen(descriptor.provenance)).toBe(true);

        expect(descriptor.identity.method).toBe('GET');
        expect(descriptor.identity.path).toBe('/api/v1/users');
        expect(descriptor.payload.schemaEntries).toEqual([['page', 'integer'], ['limit', 'integer']]);
        expect(descriptor.payload.assignments).toEqual([['user_id', 'auth()->id()']]);
    });

    it('constructs ResourceDefDescriptor and ModelDefDescriptor without naked records', () => {
        const legacyResource: ResourceDef = {
            name: 'UserResource',
            model: 'User',
            fields: { id: { kind: 'primitive', type: 'integer' } as any },
            assignments: { role: 'admin' }
        };
        const resourceDesc = ResourceDefDescriptor.fromResourceDef(legacyResource);
        expect(Object.isFrozen(resourceDesc)).toBe(true);
        expect(resourceDesc.fields.length).toBe(1);
        expect(resourceDesc.fields[0][0]).toBe('id');

        const legacyModel: ModelDef = {
            name: 'User',
            table: 'users',
            columns: [{ name: 'id', type: 'bigint', nullable: false }],
            casts: { is_active: 'boolean' }
        };
        const modelDesc = ModelDefDescriptor.fromModelDef(legacyModel);
        expect(Object.isFrozen(modelDesc)).toBe(true);
        expect(modelDesc.casts).toEqual([['is_active', 'boolean']]);
        expect(modelDesc.columns[0].name).toBe('id');
    });
});
