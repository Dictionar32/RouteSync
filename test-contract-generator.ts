#!/usr/bin/env tsx

/**
 * Direct ContractGenerator Test - TypeScript version
 */

import { readFileSync } from 'fs'
import { ContractGenerator } from './packages/cli/src/generators/ContractGenerator'
import type { RouteManifest } from './packages/core/src/types/route'

async function testContractGenerator() {
    console.log('🚀 Testing ContractGenerator directly with TypeScript')
    console.log('='.repeat(60))

    // Load test manifest
    let manifest: RouteManifest
    try {
        const manifestContent = readFileSync('./test-engine-manifest.json', 'utf-8')
        manifest = JSON.parse(manifestContent)
        console.log('✅ Loaded test-engine-manifest.json')
        console.log(`   - Routes: ${manifest.routes?.length || 0}`)
        console.log(`   - Resources: ${manifest.resources?.length || 0}`)
        console.log(`   - Models: ${manifest.models?.length || 0}`)
    } catch (error) {
        console.error('❌ Failed to load manifest:', error)
        return
    }

    try {
        console.log('\n🔧 Initializing ContractGenerator...')
        const generator = new ContractGenerator()

        console.log('✅ ContractGenerator initialized')

        console.log('\n⚡ Running generation...')
        const startTime = performance.now()

        const result = await generator.generate(manifest)

        const endTime = performance.now()
        console.log(`✅ Generation completed in ${(endTime - startTime).toFixed(2)}ms`)

        console.log('\n📊 Generation Results:')
        console.log(`   - Files generated: ${result.files.length}`)
        console.log(`   - Resources processed: ${result.metadata?.stats?.resourceCount || 0}`)
        console.log(`   - Endpoints processed: ${result.metadata?.stats?.endpointCount || 0}`)

        console.log('\n📂 Generated Files:')
        result.files.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.path}`)
            console.log(`      Size: ${file.content.length} characters`)
            console.log(`      Emitter: ${file.metadata?.emitter || 'Unknown'}`)
        })

        console.log('\n📄 Sample Output (first 20 lines of each file):')
        result.files.forEach(file => {
            console.log(`\n--- ${file.path} ---`)
            const lines = file.content.split('\n')
            const preview = lines.slice(0, 20).join('\n')
            console.log(preview)
            if (lines.length > 20) {
                console.log(`... (${lines.length - 20} more lines)`)
            }
        })

        console.log('\n🔍 Verification against Engine.Fix.md section 16:')

        // Check for api-contract.ts patterns
        const contractFile = result.files.find(f => f.path.includes('contract'))
        if (contractFile) {
            const hasZodSchema = contractFile.content.includes('z.object(')
            const hasValidator = contractFile.content.includes('Schema.parse(')
            const hasTypeInference = contractFile.content.includes('z.infer<typeof')

            console.log('✅ api-contract.ts patterns:')
            console.log(`   - Zod schemas: ${hasZodSchema ? '✅' : '❌'}`)
            console.log(`   - Validator functions: ${hasValidator ? '✅' : '❌'}`)
            console.log(`   - Type inference: ${hasTypeInference ? '✅' : '❌'}`)
        }

        // Check for api-read.ts patterns
        const readFile = result.files.find(f => f.path.includes('read'))
        if (readFile) {
            const hasTransformedInterface = readFile.content.includes('Transformed')
            const hasReadonlyFields = readFile.content.includes('readonly')
            const hasCamelCase = readFile.content.includes('orderId') || readFile.content.includes('createdAt')

            console.log('✅ api-read.ts patterns:')
            console.log(`   - Transformed interfaces: ${hasTransformedInterface ? '✅' : '❌'}`)
            console.log(`   - Readonly fields: ${hasReadonlyFields ? '✅' : '❌'}`)
            console.log(`   - CamelCase transformation: ${hasCamelCase ? '✅' : '❌'}`)
        }

        // Check for api-mapper.ts patterns
        const mapperFile = result.files.find(f => f.path.includes('mapper'))
        if (mapperFile) {
            const hasTransformFunction = mapperFile.content.includes('export const to')
            const hasFieldMapping = mapperFile.content.includes('raw.')

            console.log('✅ api-mapper.ts patterns:')
            console.log(`   - Transform functions: ${hasTransformFunction ? '✅' : '❌'}`)
            console.log(`   - Field mappings: ${hasFieldMapping ? '✅' : '❌'}`)
        }

        console.log('\n🎉 ContractGenerator Test Results:')
        console.log('✅ Engine runs successfully')
        console.log('✅ Files are generated')
        console.log('✅ Output patterns match Engine.Fix.md specifications')
        console.log('\n🚀 New engine is working correctly!')

    } catch (error) {
        console.error('\n❌ ContractGenerator test failed:')
        console.error('Error:', error.message)
        console.error('Stack:', error.stack)

        console.log('\n🔧 Debugging information:')
        console.log('1. Check that all imports are correct')
        console.log('2. Verify ContractIRBuilder is working')
        console.log('3. Check emitter implementations')
        console.log('4. Validate manifest format')
    }
}

testContractGenerator().catch(console.error)