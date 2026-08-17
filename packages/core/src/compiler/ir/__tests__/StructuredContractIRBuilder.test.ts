import { describe, expect, it } from 'vitest';
import {
    createContractIR,
    createEndpointIR,
    createRequestIR,
    createResourceIR,
    type ResourceIR,
} from '../ContractIR';
import {
    primitiveType,
} from '../../types/TypeIR';
import {
    StructuredContractIRBuilder,
} from '../StructuredContractIRBuilder';

describe('Phase 4B — domain Contract IR', () => {
    it('creates a typed resource without optional-shape guessing', () => {
        const resource = createResourceIR('OrderResource', [
            {
                name: 'totalHarga',
                type: primitiveType('number'),
                required: true,
                nullable: false,
            },
        ]);

        expect(resource).toEqual({
            kind: 'resource',
            name: 'OrderResource',
            model: undefined,
            fields: [
                {
                    name: 'totalHarga',
                    type: { kind: 'primitive', type: 'number' },
                    required: true,
                    nullable: false,
                },
            ],
            aliases: [],
            source: undefined,
        });
    });

    it('keeps request actions structurally typed', () => {
        const request = createRequestIR('OrderRequest', [
            {
                kind: 'request_action',
                name: 'create',
                fields: [
                    {
                        name: 'invoiceNumber',
                        type: primitiveType('string'),
                        required: true,
                        nullable: false,
                    },
                ],
            },
        ]);

        expect(request.actions[0]?.fields[0]?.type.kind).toBe('primitive');
    });

    it('keeps endpoint response shape explicit', () => {
        const endpoint = createEndpointIR({
            id: 'orders.index',
            method: 'GET',
            path: '/orders',
            controller: 'OrderController',
            action: 'index',
            parameters: [],
            response: {
                kind: 'endpoint_response',
                resource: 'OrderResource',
                shape: 'collection',
            },
            middleware: [],
        });

        expect(endpoint.response.shape).toBe('collection');
    });

    it('composes domains without re-discriminating them', () => {
        const resource: ResourceIR = createResourceIR('UserResource', []);

        const contract = new StructuredContractIRBuilder().build({
            version: '1',
            resources: [resource],
            requests: [
                createRequestIR('UserRequest', []),
            ],
            endpoints: [
                createEndpointIR({
                    id: 'users.index',
                    method: 'GET',
                    path: '/users',
                    controller: 'UserController',
                    action: 'index',
                    parameters: [],
                    response: {
                        kind: 'endpoint_response',
                        resource: 'UserResource',
                        shape: 'collection',
                    },
                    middleware: [],
                }),
            ],
        });

        expect(contract.kind).toBe('contract');
        expect(contract.resources).toHaveLength(1);
        expect(contract.requests).toHaveLength(1);
        expect(contract.endpoints).toHaveLength(1);
    });
});
