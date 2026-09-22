#!/usr/bin/env node

/**
 * Simple ContractEmitter Test
 */

import { ContractEmitter } from './packages/cli/src/generators/layers/ContractEmitter.js'

console.log('🚀 Simple ContractEmitter Test')

// Create a simple mock IR
const mockIR = {
    resources: [
        {
            name: 'UserResource',
            fields: [
                {
                    name: 'id',
                    semanticType: { kind: 'primitive', type: 'number' },
                    nullable: false,
                    optional: false
                },
                {
                    name: 'user_name',
                    semanticType: { kind: 'primitive', type: 'string' },
                    nullable: false,
                    optional: false
                },
                {
                    name: 'email_address',
                    semanticType: { kind: 'primitive', type: 'string' },
                    nullable: true,
                    optional: false
                }
            ]
        }
    ],
    requests: [
        {
            name: 'AuthRequest',
            actions: [
                {
                    name: 'Create',
                    fields: [
                        {
                            name: 'user_name',
                            semanticType: { kind: 'primitive', type: 'string' },
                            nullable: false,
                            optional: false
                        },
                        {
                            name: 'email_address',
                            semanticType: { kind: 'primitive', type: 'string' },
                            nullable: false,
                            optional: false
                        },
                        {
                            name: 'password',
                            semanticType: { kind: 'primitive', type: 'string' },
                            nullable: false,
                            optional: false
                        }
                    ]
                }
            ]
        }
    ]
}

try {
    console.log('📋 Testing ContractEmitter...')

    const emitter = new ContractEmitter()
    const result = emitter.emit(mockIR)

    console.log(`✅ Generated ${result.length} file(s)`)

    result.forEach((file, index) => {
        console.log(`\n📄 File ${index + 1}: ${file.path}`)
        console.log('Content:')
        console.log('='.repeat(50))
        console.log(file.content)
        console.log('='.repeat(50))
    })

    console.log('\n🎉 ContractEmitter test completed successfully!')

} catch (error) {
    console.error('❌ ContractEmitter test failed:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
}