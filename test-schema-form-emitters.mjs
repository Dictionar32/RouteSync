#!/usr/bin/env node

/**
 * Test script untuk SchemaEmitter dan FormEmitter yang sudah diperbaiki
 */

import { SchemaEmitter } from './packages/cli/src/generators/layers/SchemaEmitter.ts'
import { FormEmitter } from './packages/cli/src/generators/layers/FormEmitter.ts'

// Mock ContractIR untuk testing
const mockIR = {
    resources: [],
    requests: [
        {
            id: 'auth-request',
            name: 'AuthRequest',
            actions: [
                {
                    name: 'Create',
                    fields: [
                        {
                            name: 'email',
                            transformedName: 'email',
                            semanticType: { kind: 'primitive', type: 'string' },
                            optional: false,
                            nullable: false
                        },
                        {
                            name: 'password',
                            transformedName: 'password',
                            semanticType: { kind: 'primitive', type: 'string' },
                            optional: false,
                            nullable: false
                        }
                    ]
                }
            ],
            validation: {},
            metadata: {
                sourceFile: 'test',
                routes: [],
                generated_at: new Date().toISOString()
            }
        },
        {
            id: 'checkout-request',
            name: 'CheckoutRequest',
            actions: [
                {
                    name: 'Create',
                    fields: [
                        {
                            name: 'items',
                            transformedName: 'items',
                            semanticType: {
                                kind: 'array',
                                items: {
                                    kind: 'object',
                                    fields: {
                                        produkItemId: { kind: 'primitive', type: 'string' },
                                        qty: { kind: 'primitive', type: 'number' }
                                    }
                                }
                            },
                            optional: true,
                            nullable: false
                        },
                        {
                            name: 'shipping_nama',
                            transformedName: 'shippingNama',
                            semanticType: { kind: 'primitive', type: 'string' },
                            optional: true,
                            nullable: true
                        }
                    ]
                }
            ],
            validation: {},
            metadata: {
                sourceFile: 'test',
                routes: [],
                generated_at: new Date().toISOString()
            }
        }
    ],
    endpoints: [],
    sharedTypes: [],
    enums: [],
    imports: [],
    metadata: {
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        generator_version: '1.0.0',
        source_files: [],
        total_resources: 0,
        total_requests: 2,
        total_endpoints: 0
    }
}

console.log('Testing SchemaEmitter...')
const schemaEmitter = new SchemaEmitter()
const schemaFiles = schemaEmitter.emit(mockIR)

console.log('\n=== SchemaEmitter Output ===')
console.log('Files generated:', schemaFiles.length)
for (const file of schemaFiles) {
    console.log(`\nFile: ${file.path}`)
    console.log('Content:')
    console.log(file.content)
}

console.log('\n\nTesting FormEmitter...')
const formEmitter = new FormEmitter()
const formFiles = formEmitter.emit(mockIR)

console.log('\n=== FormEmitter Output ===')
console.log('Files generated:', formFiles.length)
for (const file of formFiles) {
    console.log(`\nFile: ${file.path}`)
    console.log('Content:')
    console.log(file.content)
}

console.log('\n✅ Test completed successfully!')