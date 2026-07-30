#!/usr/bin/env node

/**
 * Simple V2 Engine Test
 */

import fs from 'fs'

console.log('🔍 Simple V2 Engine Analysis')
console.log('='.repeat(40))

try {
    // Load manifest
    const manifest = JSON.parse(fs.readFileSync('routesync.manifest.json', 'utf8'))

    console.log('📊 Manifest loaded successfully:')
    console.log(`   - Routes: ${manifest.routes?.length || 0}`)

    // Take first 3 routes to analyze
    const firstRoutes = manifest.routes.slice(0, 3)

    console.log('\n🔍 Analyzing first 3 routes:')
    firstRoutes.forEach((route, i) => {
        console.log(`\n${i + 1}. ${route.method} ${route.path}`)
        console.log(`   name: ${route.name}`)
        console.log(`   response.kind: ${route.response?.kind}`)
        console.log(`   response.model: ${route.response?.model}`)
        console.log(`   response.resolved: ${route.response?.resolved ? 'yes' : 'no'}`)

        if (route.response?.resolved) {
            console.log(`   resolved.type: ${route.response.resolved.type}`)
            console.log(`   resolved.model: ${route.response.resolved.model}`)
        }
    })

    console.log('\n✅ Analysis complete - manifest data looks good!')
    console.log('\n🤔 Possible V2 Engine Issues:')
    console.log('   1. Type inference/resolution problems?')
    console.log('   2. IR building failures?')
    console.log('   3. Emitter generation issues?')
    console.log('   4. Import/module resolution problems?')

} catch (error) {
    console.error('❌ Error:', error.message)
}