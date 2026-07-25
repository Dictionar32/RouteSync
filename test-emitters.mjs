#!/usr/bin/env node

/**
 * Simple test runner untuk emitters
 * Jalankan: node test-emitters.mjs
 */

import path from 'path'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runTests() {
    try {
        console.log('🧪 Starting Phase 2 Emitters Tests...\n')

        // Import emitters
        const { ContractEmitter } = await import('./packages/cli/src/generators/layers/ContractEmitter.ts')
        const { ReadEmitter } = await import('./packages/cli/src/generators/layers/ReadEmitter.ts')
        const { SchemaEmitter } = await import('./packages/cli/src/generators/layers/SchemaEmitter.ts')
        const { FieldEmitter } = await import('./packages/cli/src/generators/layers/FieldEmitter.ts')
        const { MapperEmitter } = await import('./packages/cli/src/generators/layers/MapperEmitter.ts')

        // Load manifest
        console.log('📋 Loading manifest...')
        const manifestPath = path.join(__dirname, 'routesync.manifest.json')
        let manifest
        try {
            const content = await fs.readFile(manifestPath, 'utf-8')
            manifest = JSON.parse(content)
            console.log(`✅ Loaded manifest with ${manifest.routes?.length || 0} routes\n`)
        } catch (e) {
            console.error('❌ Failed to load manifest:', e.message)
            process.exit(1)
        }

        // Create temp dir
        const tmpDir = path.join('/tmp', `routesync-test-${Date.now()}`)
        await fs.ensureDir(tmpDir)

        // Context
        const context = {
            manifest,
            knownModels: new Set(),
            knownResources: new Set(),
            knownSchemas: new Set(),
            kernel: undefined,
        }

        console.log('🔄 Running emitters...\n')

        // Test ContractEmitter
        console.log('1️⃣  ContractEmitter...')
        try {
            const contractResult = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            console.log(`   ✅ Generated ${contractResult.output.lines.length} lines`)
            console.log(`   ✅ routeResponseMap size: ${contractResult.routeResponseMap.size}`)

            const contractContent = contractResult.output.lines.join('\n')
            if (contractContent.includes(' any')) {
                console.error('   ❌ Found `any` type in output!')
            } else {
                console.log('   ✅ No `any` types')
            }
        } catch (e) {
            console.error('   ❌ Error:', e.message)
            throw e
        }

        // Test ReadEmitter
        console.log('\n2️⃣  ReadEmitter...')
        try {
            const contractResult = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const readResult = await ReadEmitter.generate(path.join(tmpDir, 'types'), context, contractResult.routeResponseMap)
            console.log(`   ✅ Generated ${readResult.lines.length} lines`)

            const readContent = readResult.lines.join('\n')
            if (readContent.includes(' any')) {
                console.error('   ❌ Found `any` type in output!')
            } else {
                console.log('   ✅ No `any` types')
            }
        } catch (e) {
            console.error('   ❌ Error:', e.message)
            throw e
        }

        // Test SchemaEmitter
        console.log('\n3️⃣  SchemaEmitter...')
        try {
            const schemaResult = await SchemaEmitter.generate(path.join(tmpDir, 'contract'), context)
            console.log(`   ✅ Generated ${schemaResult.lines.length} lines`)

            const schemaContent = schemaResult.lines.join('\n')
            if (schemaContent.includes(' any')) {
                console.error('   ❌ Found `any` type in output!')
            } else {
                console.log('   ✅ No `any` types')
            }
        } catch (e) {
            console.error('   ❌ Error:', e.message)
            throw e
        }

        // Test FieldEmitter
        console.log('\n4️⃣  FieldEmitter...')
        try {
            const fieldResult = await FieldEmitter.generate(path.join(tmpDir, 'contract'), context)
            console.log(`   ✅ Generated ${fieldResult.lines.length} lines`)

            const fieldContent = fieldResult.lines.join('\n')
            if (fieldContent.includes(' any')) {
                console.error('   ❌ Found `any` type in output!')
            } else {
                console.log('   ✅ No `any` types')
            }
        } catch (e) {
            console.error('   ❌ Error:', e.message)
            throw e
        }

        // Test MapperEmitter
        console.log('\n5️⃣  MapperEmitter...')
        try {
            const contractResult = await ContractEmitter.generate(path.join(tmpDir, 'contract'), context)
            const mapperResult = await MapperEmitter.generate(path.join(tmpDir, 'mappers'), context, contractResult.routeResponseMap)
            console.log(`   ✅ Generated ${mapperResult.lines.length} lines`)

            const mapperContent = mapperResult.lines.join('\n')
            if (mapperContent.includes(' any')) {
                console.error('   ❌ Found `any` type in output!')
            } else {
                console.log('   ✅ No `any` types')
            }
        } catch (e) {
            console.error('   ❌ Error:', e.message)
            throw e
        }

        // Cleanup
        await fs.remove(tmpDir)

        console.log('\n✨ All emitters passed!\n')
    } catch (e) {
        console.error('\n❌ Test failed:', e)
        process.exit(1)
    }
}

runTests()
