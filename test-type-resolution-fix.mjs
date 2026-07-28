#!/usr/bin/env node

/**
 * Test Type Resolution Fixes
 * 
 * Tests the ContractIRBuilder fixes:
 * 1. ✅ Remove redundant Collection/Paginated aliases (only Show/Index remain)
 * 2. ✅ Use resolved type information from manifest
 */

import fs from 'fs'
import { ContractGenerator } from './packages/cli/src/generators/ContractGenerator.js'

console.log('🔧 TESTING TYPE RESOLUTION FIXES')
console.log('='.repeat(50))

const tokoOnlinePath = '/home/annas-zen/Documents/laragon-docker/www/toko-online'
const manifestPath = `${tokoOnlinePath}/routesync.manifest.json`

try {
    // Load manifest
    console.log('📄 Loading manifest...')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    console.log(`   Loaded: ${manifest.routes?.length || 0} routes, ${manifest.resources?.length || 0} resources`)

    // Generate using ContractGenerator
    console.log('\n🏗️  Running ContractGenerator with fixes...')
    const generator = new ContractGenerator()
    const result = await generator.generate(manifest)

    console.log(`   Generated ${result.files.length} files`)
    console.log(`   Resources processed: ${result.metadata?.stats?.resourceCount || 0}`)

    // Check api-read.ts output for both issues
    const readFile = result.files.find(f => f.path === 'types/api-read.ts')

    if (readFile) {
        console.log('\n🔍 ANALYZING api-read.ts OUTPUT')
        console.log('─'.repeat(40))

        const content = readFile.content

        // Issue 1: Check for redundant Collection/Paginated types
        const hasCollectionTypes = content.includes('Collection =')
        const hasPaginatedTypes = content.includes('Paginated =')
        const hasShowTypes = content.includes('Show =')
        const hasIndexTypes = content.includes('Index =')

        console.log('📋 Type Alias Analysis:')
        console.log(`   ✅ Show aliases: ${hasShowTypes ? 'Present' : 'Missing'}`)
        console.log(`   ✅ Index aliases: ${hasIndexTypes ? 'Present' : 'Missing'}`)
        console.log(`   ${hasCollectionTypes ? '❌' : '✅'} Collection aliases: ${hasCollectionTypes ? 'Found (should be removed)' : 'Not found (good)'}`)
        console.log(`   ${hasPaginatedTypes ? '❌' : '✅'} Paginated aliases: ${hasPaginatedTypes ? 'Found (should be removed)' : 'Not found (good)'}`)

        // Issue 2: Check for proper type resolution (not 'unknown')
        const unknownFields = content.match(/readonly \w+: unknown/g) || []
        const resolvedFields = content.match(/readonly \w+: (string|number|boolean)/g) || []

        console.log('\n🎯 Type Resolution Analysis:')
        console.log(`   ✅ Resolved types: ${resolvedFields.length} fields`)
        console.log(`   ${unknownFields.length > 0 ? '⚠️' : '✅'} Unknown types: ${unknownFields.length} fields`)

        if (unknownFields.length > 0) {
            console.log('   Unknown fields:', unknownFields.slice(0, 5).map(f => f.trim()))
            if (unknownFields.length > 5) console.log(`   ... and ${unknownFields.length - 5} more`)
        }

        // Show sample of resolved fields
        if (resolvedFields.length > 0) {
            console.log('   Sample resolved fields:', resolvedFields.slice(0, 3).map(f => f.trim()))
        }

        // Show first interface for detailed analysis
        const interfaceMatch = content.match(/export interface (\w+) \{[\s\S]*?\}/m)
        if (interfaceMatch) {
            console.log('\n📋 Sample Interface:')
            console.log('   ' + interfaceMatch[0].split('\n').slice(0, 6).join('\n   '))
            if (interfaceMatch[0].split('\n').length > 6) {
                console.log('   ... (truncated)')
            }
        }
    } else {
        console.log('❌ api-read.ts not found in generated files')
    }

    // Summary
    console.log('\n🎯 FIX VALIDATION SUMMARY')
    console.log('─'.repeat(40))

    if (readFile) {
        const content = readFile.content
        const hasNoCollectionTypes = !content.includes('Collection =')
        const hasNoPaginatedTypes = !content.includes('Paginated =')
        const hasShowAndIndex = content.includes('Show =') && content.includes('Index =')
        const unknownCount = (content.match(/readonly \w+: unknown/g) || []).length
        const resolvedCount = (content.match(/readonly \w+: (string|number|boolean)/g) || []).length

        console.log(`✅ Issue 1 (Redundant aliases): ${hasNoCollectionTypes && hasNoPaginatedTypes && hasShowAndIndex ? 'FIXED' : 'NEEDS WORK'}`)
        console.log(`${resolvedCount > unknownCount ? '✅' : '⚠️'} Issue 2 (Type resolution): ${resolvedCount > 0 ? 'IMPROVED' : 'NEEDS WORK'} (${resolvedCount} resolved, ${unknownCount} unknown)`)
    }

} catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.stack) {
        console.error(error.stack)
    }
}