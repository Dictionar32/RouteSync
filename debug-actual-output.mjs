#!/usr/bin/env node

/**
 * Debug Actual Emitter Output
 */

import fs from 'fs'
import { ContractIRBuilder } from './packages/core/src/ir/ContractIRBuilder.js'
import { ContractGenerator } from './packages/cli/src/generators/ContractGenerator.js'

// Simple manifest for testing
const testManifest = {
    routes: [
        { name: 'produk.index', method: 'GET', path: '/produk', id: 'get_produk' },
        { name: 'produk.show', method: 'GET', path: '/produk/{id}', id: 'show_produk' },
        { name: 'produk.store', method: 'POST', path: '/produk', id: 'create_produk' },
        { name: 'produk.update', method: 'PUT', path: '/produk/{id}', id: 'update_produk' }
    ],
    resources: [
        {
            name: 'ProdukResource',
            fields: [
                { name: 'id', type: 'number' },
                { name: 'name', type: 'string' },
                { name: 'price', type: 'number' },
                { name: 'category_id', type: 'number' },
            ]
        }
    ],
    models: []
}

try {
    console.log('🔍 Debugging Actual Emitter Output')
    console.log('='.repeat(50))

    const irBuilder = new ContractIRBuilder()
    const contractIR = irBuilder.buildFromManifest(testManifest)

    const generator = new ContractGenerator()
    const files = generator.generate(contractIR)

    // Find and analyze the read file
    const readFile = files.find(f => f.path.includes('api-read'))

    if (readFile) {
        console.log('📄 ACTUAL ReadEmitter Output:')
        console.log('─'.repeat(30))
        console.log(readFile.content)

        const hasApiResponse = readFile.content.includes('ApiResponse')
        const hasResourceResponse = readFile.content.includes('ResourceResponse')

        console.log('\n🔍 Analysis:')
        console.log(`   • Contains ApiResponse: ${hasApiResponse ? '❌ FOUND' : '✅ CLEAN'}`)
        console.log(`   • Contains ResourceResponse: ${hasResourceResponse ? '❌ FOUND' : '✅ CLEAN'}`)

        if (hasApiResponse || hasResourceResponse) {
            console.log('\n❌ ReadEmitter needs fixing - should NOT generate response types')
        } else {
            console.log('\n✅ ReadEmitter is clean - no response types')
        }
    } else {
        console.log('❌ No api-read file found')
    }

} catch (error) {
    console.error('Error:', error.message)
}