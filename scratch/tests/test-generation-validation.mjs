#!/usr/bin/env node

/**
 * Task 3: Generation Output Validation Script
 * Validates that all files were generated correctly
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const OUTPUT_DIR = '/home/annas-zen/Documents/laragon-docker/www/toko-online/frontend/src/api'

console.log('='.repeat(80))
console.log('TASK 3: Generation Output Validation')
console.log('='.repeat(80))

const requiredFiles = [
    // Core files
    'index.ts',
    'api.ts',
    'hooks.ts',
    'constants.ts',
    'query-key.ts',
    'actions.ts',
    'routesync.runtime.ts',

    // Type files
    'types/api-read.ts',
    'types/api-form.ts',
    'types/index.ts',

    // Contract files
    'contract/api-contract.ts',
    'contract/api-schema.ts',
    'contract/api-field.ts',

    // Mapper files
    'mappers/api-mapper.ts',

    // Core models
    'core/models.ts',
]

let allPassed = true

console.log('\n1. Checking required files...')
console.log('-'.repeat(80))

for (const file of requiredFiles) {
    const fullPath = join(OUTPUT_DIR, file)
    const exists = existsSync(fullPath)

    if (exists) {
        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n').length
        console.log(`  ✅ ${file.padEnd(35)} (${lines} lines)`)
    } else {
        console.log(`  ❌ ${file} - MISSING`)
        allPassed = false
    }
}

console.log('\n2. Checking TypeScript compilation...')
console.log('-'.repeat(80))

try {
    const { execSync } = await import('child_process')
    execSync('npx tsc --noEmit', {
        cwd: '/home/annas-zen/Documents/laragon-docker/www/toko-online/frontend',
        stdio: 'pipe'
    })
    console.log('  ✅ TypeScript compilation passed')
} catch (error) {
    console.log('  ❌ TypeScript compilation failed')
    console.log(error.stdout?.toString() || error.message)
    allPassed = false
}

console.log('\n3. Validating file content quality...')
console.log('-'.repeat(80))

// Check api-read.ts
const apiReadPath = join(OUTPUT_DIR, 'types/api-read.ts')
if (existsSync(apiReadPath)) {
    const content = readFileSync(apiReadPath, 'utf-8')

    // Should have camelCase transformed fields
    const hasCamelCase = content.includes('produkItemId') &&
        content.includes('shippingNama') &&
        content.includes('totalHarga')

    // Should NOT have snake_case in interface fields
    const hasSnakeCase = /^\s+(produk_item_id|shipping_nama|total_harga):/gm.test(content)

    if (hasCamelCase && !hasSnakeCase) {
        console.log('  ✅ api-read.ts: Proper camelCase transformation')
    } else {
        console.log('  ❌ api-read.ts: Snake_case found in interface fields')
        allPassed = false
    }
} else {
    console.log('  ❌ api-read.ts not found')
    allPassed = false
}

// Check api-form.ts
const apiFormPath = join(OUTPUT_DIR, 'types/api-form.ts')
if (existsSync(apiFormPath)) {
    const content = readFileSync(apiFormPath, 'utf-8')

    // Should have proper form types with actions (Create, Update, etc.)
    const hasFormTypes = content.includes('RegisterForm') &&
        content.includes('LoginForm') &&
        content.includes('Create:')

    // Should have camelCase fields
    const hasCamelCase = content.includes('produkItemId') ||
        content.includes('shippingNama')

    if (hasFormTypes && hasCamelCase) {
        console.log('  ✅ api-form.ts: Proper form types with camelCase')
    } else {
        console.log('  ❌ api-form.ts: Missing form types or camelCase')
        allPassed = false
    }
} else {
    console.log('  ❌ api-form.ts not found')
    allPassed = false
}

// Check mappers
const mapperPath = join(OUTPUT_DIR, 'mappers/api-mapper.ts')
if (existsSync(mapperPath)) {
    const content = readFileSync(mapperPath, 'utf-8')

    // Should have mapper functions
    const hasMappers = content.includes('toRegisterResponseRead') &&
        content.includes('toOrderResourceRead')

    // Should map snake_case to camelCase
    const hasMapping = content.includes('produk_item_id') &&
        content.includes('produkItemId')

    if (hasMappers && hasMapping) {
        console.log('  ✅ api-mapper.ts: Proper snake_case → camelCase mapping')
    } else {
        console.log('  ❌ api-mapper.ts: Missing mappers or mapping logic')
        allPassed = false
    }
} else {
    console.log('  ❌ api-mapper.ts not found')
    allPassed = false
}

// Check hooks
const hooksPath = join(OUTPUT_DIR, 'hooks.ts')
if (existsSync(hooksPath)) {
    const content = readFileSync(hooksPath, 'utf-8')

    // Should have React Query hooks
    const hasHooks = content.includes('defineHooks') &&
        content.includes('QueryKey') &&
        content.includes('endpoint')

    if (hasHooks) {
        console.log('  ✅ hooks.ts: Proper React Query integration')
    } else {
        console.log('  ❌ hooks.ts: Missing React Query integration')
        allPassed = false
    }
} else {
    console.log('  ❌ hooks.ts not found')
    allPassed = false
}

// Check schemas (Zod validation)
const schemaPath = join(OUTPUT_DIR, 'contract/api-schema.ts')
if (existsSync(schemaPath)) {
    const content = readFileSync(schemaPath, 'utf-8')

    // Should have Zod schemas
    const hasZod = content.includes('import { z } from \'zod\'') &&
        content.includes('Schema = z.object') &&
        content.includes('z.infer')

    if (hasZod) {
        console.log('  ✅ api-schema.ts: Proper Zod validation schemas')
    } else {
        console.log('  ❌ api-schema.ts: Missing Zod schemas')
        allPassed = false
    }
} else {
    console.log('  ❌ api-schema.ts not found')
    allPassed = false
}

console.log('\n' + '='.repeat(80))
if (allPassed) {
    console.log('✅ ALL VALIDATION CHECKS PASSED')
    console.log('\nTask 3 Generation Engine: SUCCESS ✅')
    console.log('\nGenerated files summary:')
    console.log(`  • ${requiredFiles.length} core files generated`)
    console.log('  • TypeScript compilation: PASSED')
    console.log('  • CamelCase transformation: CORRECT')
    console.log('  • Mapper logic: CORRECT')
    console.log('  • React Query hooks: GENERATED')
    console.log('  • Zod schemas: GENERATED')
} else {
    console.log('❌ SOME VALIDATION CHECKS FAILED')
    process.exit(1)
}
console.log('='.repeat(80))
