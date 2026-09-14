import { describe, it, expect } from 'vitest';
import {
    ResolvedSemanticTypeFactory,
    matchResolvedSemanticType,
    TypeIRUtils,
    createEndpointId,
    createResourceId,
    createRequestId,
    createRoutePath,
    createHttpHeaderName,
    createSourceLineNumber,
    type ResolvedSemanticType,
    type TypeIR
} from '@routesync/core';

describe('Contract IR Modular Architecture & Type Hardening SSOT (Issue #43)', () => {
    it('creates branded nominal domain atoms with zero primitive obsession', () => {
        const epId = createEndpointId('ep_users_list');
        const resId = createResourceId('res_user');
        const reqId = createRequestId('req_create_user');
        const routePath = createRoutePath('/api/v1/users/{id}');
        const header = createHttpHeaderName('X-API-Key');
        const line = createSourceLineNumber(42);

        expect(epId).toBe('ep_users_list');
        expect(resId).toBe('res_user');
        expect(reqId).toBe('req_create_user');
        expect(routePath).toBe('/api/v1/users/{id}');
        expect(header).toBe('X-API-Key');
        expect(line).toBe(42);
    });

    it('creates ObjectSemanticTypeIR with frozen propertyEntries tuples (zero naked records)', () => {
        const properties = {
            id: ResolvedSemanticTypeFactory.primitive('integer'),
            email: ResolvedSemanticTypeFactory.primitive('string', 'email')
        };
        const node = ResolvedSemanticTypeFactory.object(properties);

        expect(node.kind).toBe('object');
        expect(Object.isFrozen(node)).toBe(true);
        expect(Object.isFrozen(node.properties)).toBe(true);
        expect(node.propertyEntries).toBeDefined();
        expect(node.propertyEntries).toHaveLength(2);
        expect(node.propertyEntries![0]).toEqual(['id', properties.id]);
        expect(node.propertyEntries![1]).toEqual(['email', properties.email]);
    });

    it('executes catamorphic pattern matching across all ResolvedSemanticType variants without branching', () => {
        const variants: ResolvedSemanticType[] = [
            ResolvedSemanticTypeFactory.primitive('string'),
            ResolvedSemanticTypeFactory.resource('UserResource', false),
            ResolvedSemanticTypeFactory.model('App\\Models\\User'),
            ResolvedSemanticTypeFactory.object({ name: ResolvedSemanticTypeFactory.primitive('string') }),
            ResolvedSemanticTypeFactory.array(ResolvedSemanticTypeFactory.primitive('number')),
            ResolvedSemanticTypeFactory.union([ResolvedSemanticTypeFactory.primitive('string')]),
            ResolvedSemanticTypeFactory.literal(true)
        ];

        const kinds = variants.map(v =>
            matchResolvedSemanticType(v, {
                primitive: p => `prim:${p.type}`,
                resource: r => `res:${r.resource}`,
                model: m => `mod:${m.model}`,
                object: o => `obj:${o.propertyEntries?.length ?? 0}`,
                array: a => `arr:${a.items.kind}`,
                union: u => `uni:${u.types.length}`,
                literal: l => `lit:${String(l.value)}`
            })
        );

        expect(kinds).toEqual([
            'prim:string',
            'res:UserResource',
            'mod:App\\Models\\User',
            'obj:1',
            'arr:primitive',
            'uni:1',
            'lit:true'
        ]);
    });

    it('TypeIRUtils performs composition and unwrapping with immutable returns', () => {
        const prim: TypeIR = { kind: 'primitive', type: 'string' };
        const nullable = TypeIRUtils.makeNullable(prim);
        const optional = TypeIRUtils.makeOptional(nullable);

        expect(Object.isFrozen(nullable)).toBe(true);
        expect(Object.isFrozen(optional)).toBe(true);
        expect(TypeIRUtils.isNullable(nullable)).toBe(true);
        expect(TypeIRUtils.isOptional(optional)).toBe(true);
        expect(TypeIRUtils.isDeepNullable(optional)).toBe(true);
        expect(TypeIRUtils.isDeepOptional(optional)).toBe(true);
        expect(TypeIRUtils.unwrapType(optional)).toEqual(prim);
        expect(TypeIRUtils.describeType(optional)).toBe('primitive(string) | null?');
    });
});
