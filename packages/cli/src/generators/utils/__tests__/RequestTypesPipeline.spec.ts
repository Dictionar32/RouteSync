import { describe, test, expect } from 'vitest';
import { RequestTypesPipeline } from '../RequestTypesPipeline';
import type { RouteManifest } from '../../../../core/src/types/route';

describe('RequestTypesPipeline Specification (TDD Suite)', () => {
    test('1. Groups mutating routes and extracts camelCase form actions', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    path: '/api/customers',
                    method: 'POST',
                    schema: {
                        rules: {
                            'first_name': ['required', 'string'],
                            'last_name': ['required', 'string']
                        }
                    }
                },
                {
                    path: '/api/customers/{id}',
                    method: 'GET' // Ignored in form request types
                }
            ]
        };

        const pipeline = new RequestTypesPipeline();
        const artifact = pipeline.execute(manifest);

        expect(artifact.requestTypes).toHaveLength(1);
        const customerForm = artifact.requestTypes[0];
        expect(customerForm.resourceName).toBe('customers');
        expect(customerForm.formTypeName).toBe('CustomersForm');
        expect(customerForm.actions[0].fields[0].transformedName).toBe('firstName');
        expect(customerForm.actions[0].fields[1].transformedName).toBe('lastName');
    });

    test('2. Merges create and update actions under same resource group', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    path: '/api/items',
                    method: 'POST',
                    schema: { rules: { 'name': ['required', 'string'] } }
                },
                {
                    path: '/api/items/{id}',
                    method: 'PUT',
                    schema: { rules: { 'name': ['sometimes', 'string'], 'status': ['sometimes', 'string'] } }
                }
            ]
        };

        const pipeline = new RequestTypesPipeline();
        const artifact = pipeline.execute(manifest);

        expect(artifact.requestTypes).toHaveLength(1);
