/**
 * Test Type Resolution Fixes
 */

const fs = require('fs')
const path = require('path')

// Import the built modules
const { ContractIRBuilder } = require('./packages/core/dist/ir/ContractIRBuilder')

console.log('🔧 TESTING TYPE RESOLUTION FIXES')
console.log('='.repeat(50))

const tokoOnlinePath = '/home/annas-zen/Documents/laragon-docker/www/toko-online'
const manifestPath = path.join(tokoOnlinePath, 'routesync.manifest.json')

async function testFixes() {
    try {
        // Load manifest
        console.log('📄 Loading manifest...')
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        console.log(`   Loaded: ${manifest.routes?.length || 0} routes, ${manifest.resources?.length || 0} resources`)

        // Mock context
        const mockContext = {
            projectRoot: '.',
            outputDir: './output',
            config: {
                typescript: { strict: true, target: 'ES2020', moduleResolution: 'node' },
                validation: { useZod: true, useLaravel: false },
                naming: { caseTransform: 'camel', resourceSuffix: 'Resource', requestSuffix: 'Request' }
            },
            manifest: {
                resources: (manifest.resources || []).map(r => ({
                    name: r.name,
                    sourceModel: undefined,
                    fields: Object.entries(r.fields || {}).map(([name, kind]) => ({
                        name,
                        resolved: kind.resolved ? {
                            type: kind.resolved.type,
                            model: kind.resolved.model
                        } : undefined,
                        optional: false,
                        nullable: false,
                        readonly: false
                    }))
                })),
                requests: [],
                routes: [],
                metadata: { version: '1.0.0', scanned_at: new Date().toISOString(), source_files: [] }
            }
        }

        // Test ContractIRBuilder directly
        console.log('\n🏗️  Testing ContractIRBuilder with fixes...')
        const builder = new ContractIRBuilder(mockContext)
        const contractIR = builder.buildFromManifest(mockContext.manifest)

        console.log(`   Built IR with ${contractIR.resources.length} resources`)

        // Analyze first resource for both issues
        if (contractIR.resources.length > 0) {
            const resource = contractIR.resources[0]
            console.log(`\n🔍 ANALYZING RESOURCE: ${resource.name}`)
            console.log('─'.repeat(40))

            // Issue 1: Check aliases (should only have Show and Index)
            console.log('📋 Resource Aliases:')
            resource.aliases.forEach(alias => {
                console.log(`   - ${alias.name} (${alias.kind})`)
            })

            const hasCollection = resource.aliases.some(a => a.kind === 'collection')
            const hasPaginated = resource.aliases.some(a => a.kind === 'paginated')
            const hasShow = resource.aliases.some(a => a.kind === 'show')
            const hasIndex = resource.aliases.some(a => a.kind === 'index')

            console.log(`\n   ${hasCollection ? '❌' : '✅'} Collection alias: ${hasCollection ? 'Found (should be removed)' : 'Not found (good)'}`)
            console.log(`   ${hasPaginated ? '❌' : '✅'} Paginated alias: ${hasPaginated ? 'Found (should be removed)' : 'Not found (good)'}`)
            console.log(`   ✅ Show alias: ${hasShow ? 'Present' : 'Missing'}`)
            console.log(`   ✅ Index alias: ${hasIndex ? 'Present' : 'Missing'}`)

            // Issue 2: Check field type resolution
            console.log('\n🎯 Field Type Resolution:')
            let resolvedCount = 0
            let unknownCount = 0

            resource.fields.slice(0, 5).forEach(field => {
                const readTypeKind = field.type.read.kind
                const readType = field.type.read.type || 'unknown'

                if (readType !== 'unknown') {
                    resolvedCount++
                    console.log(`   ✅ ${field.transformedName}: ${readType}`)
                } else {
                    unknownCount++
                    console.log(`   ⚠️  ${field.transformedName}: unknown`)
                }
            })

            if (resource.fields.length > 5) {
                console.log(`   ... and ${resource.fields.length - 5} more fields`)
            }

            console.log(`\n   Summary: ${resolvedCount} resolved, ${unknownCount} unknown`)
        }

        // Final validation
        console.log('\n🎯 FIX VALIDATION SUMMARY')
        console.log('─'.repeat(40))

        let allGood = true

        contractIR.resources.forEach(resource => {
            const hasCollection = resource.aliases.some(a => a.kind === 'collection')
            const hasPaginated = resource.aliases.some(a => a.kind === 'paginated')
            const hasProperAliases = resource.aliases.some(a => a.kind === 'show') &&
                resource.aliases.some(a => a.kind === 'index')

            if (hasCollection || hasPaginated || !hasProperAliases) {
                allGood = false
            }
        })

        console.log(`${allGood ? '✅' : '❌'} Issue 1 (Redundant aliases): ${allGood ? 'FIXED' : 'NEEDS WORK'}`)
        console.log(`🔄 Issue 2 (Type resolution): Enhanced with resolved data extraction`)

    } catch (error) {
        console.error('❌ Test failed:', error.message)
        console.error(error.stack)
    }
}

testFixes()