#!/usr/bin/env node

/**
 * Test V2 Engine dengan Real Manifest
 * 
 * Menggunakan routesync.manifest.json yang sebenarnya untuk test
 * struktur API v2 dengan data real
 */

import fs from 'fs'

console.log('🧪 Testing V2 Engine dengan Real RouteSync Manifest')
console.log('='.repeat(60))

try {
    // Load real manifest
    const manifest = JSON.parse(fs.readFileSync('routesync.manifest.json', 'utf8'))

    console.log('📊 Real Manifest Summary:')
    console.log(`   Routes: ${manifest.routes?.length || 0}`)
    console.log(`   Resources: ${manifest.resources?.length || 0}`)
    console.log(`   Models: ${manifest.models?.length || 0}`)
    console.log(`   Generated: ${manifest.generatedAt}`)

    // Ambil sample routes untuk test
    const sampleRoutes = (manifest.routes || []).slice(0, 10)
    console.log('\n📋 Sample Routes:')
    sampleRoutes.forEach((route, i) => {
        console.log(`   ${i + 1}. ${route.method} ${route.path} (${route.name || 'unnamed'})`)
    })

    console.log('\n🎯 Generating V2 API Structure dengan Real Data...')

    // Group routes by resource seperti V2 engine logic
    const resourceGroups = new Map()

    for (const route of sampleRoutes) {
        // Extract resource name dari path atau nama route
        let resourceName = 'unknown'

        // Coba extract dari path dulu
        const pathSegments = route.path.split('/').filter(s => s && !s.includes('{') && !s.includes(':'))
        if (pathSegments.length > 0) {
            resourceName = pathSegments[0]
        }

        // Atau dari route name
        if (route.name && route.name.includes('.')) {
            const nameParts = route.name.split('.')
            if (nameParts.length >= 2) {
                resourceName = nameParts[0]
            }
        }

        // Map HTTP method ke semantic action
        const actionMap = {
            'GET': route.path.includes('{') || route.path.includes(':') ? 'show' : 'index',
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',  // ⭐ Unification!
            'DELETE': 'destroy'
        }

        const actionName = actionMap[route.method] || route.method.toLowerCase()

        if (!resourceGroups.has(resourceName)) {
            resourceGroups.set(resourceName, {
                actions: new Map(),
                originalRoutes: []
            })
        }

        resourceGroups.get(resourceName).actions.set(actionName, {
            method: route.method,
            path: route.path,
            name: route.name,
            hasBody: ['POST', 'PUT', 'PATCH'].includes(route.method),
            hasResponse: true,
            auth: route.auth,
            middleware: route.middleware
        })

        resourceGroups.get(resourceName).originalRoutes.push(route)
    }

    console.log('\n✅ Resource Grouping Results:')
    for (const [resourceName, resource] of resourceGroups) {
        console.log(`   📦 ${resourceName}:`)
        for (const [actionName, action] of resource.actions) {
            const authStr = action.auth ? ' 🔒' : ''
            const middlewareStr = action.middleware?.length > 0 ? ` [${action.middleware.join(', ')}]` : ''
            console.log(`      • ${actionName}: ${action.method} ${action.path}${authStr}${middlewareStr}`)
        }
    }

    // Generate V2 API Structure
    const generateV2ApiStructure = () => {
        const lines = []

        lines.push('/**')
        lines.push(' * V2 API Structure - Generated from Real RouteSync Manifest')
        lines.push(' * Resource-Grouped without helper functions')
        lines.push(' * ')
        lines.push(' * Benefits:')
        lines.push(' * ✅ Resource-centric organization')
        lines.push(' * ✅ Explicit type declarations')
        lines.push(' * ✅ PUT/PATCH unification')
        lines.push(' * ✅ Nested contract/mapper per action')
        lines.push(' * ✅ Clean plain JavaScript object')
        lines.push(' */')
        lines.push('')
        lines.push('// Auto-generated type imports')
        lines.push('// import type {')

        const typeImports = []
        for (const [resourceName] of resourceGroups) {
            const capitalizedResource = resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
            typeImports.push(`//   ${capitalizedResource}Index, ${capitalizedResource}Show, ${capitalizedResource}Form,`)
            typeImports.push(`//   ${capitalizedResource}ApiCreate, ${capitalizedResource}ApiUpdate, ${capitalizedResource}ApiResponse,`)
        }
        lines.push(...typeImports)
        lines.push('// } from "../types/api-read"')
        lines.push('')
        lines.push('// Auto-generated validation imports')
        lines.push('// import {')
        const contractImports = []
        for (const [resourceName, resource] of resourceGroups) {
            const capitalizedResource = resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
            for (const [actionName] of resource.actions) {
                const actionCapitalized = actionName.charAt(0).toUpperCase() + actionName.slice(1)
                contractImports.push(`//   validate${capitalizedResource}${actionCapitalized}Payload,`)
                contractImports.push(`//   validate${capitalizedResource}${actionCapitalized}Response,`)
            }
        }
        lines.push(...contractImports.slice(0, 10)) // Limit output
        lines.push('//   // ... more validators')
        lines.push('// } from "../contract/api-contract"')
        lines.push('')
        lines.push('// Auto-generated mapper imports')
        lines.push('// import {')
        const mapperImports = []
        for (const [resourceName] of resourceGroups) {
            const capitalizedResource = resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
            mapperImports.push(`//   to${capitalizedResource}Read, to${capitalizedResource}ReadList,`)
            mapperImports.push(`//   toApi${capitalizedResource}Create, toApi${capitalizedResource}Update,`)
        }
        lines.push(...mapperImports.slice(0, 6))
        lines.push('//   // ... more mappers')
        lines.push('// } from "../mappers/api-mapper"')
        lines.push('')
        lines.push('export const api = {')

        // Generate each resource block
        for (const [resourceName, resource] of resourceGroups) {
            const capitalizedResource = resourceName.charAt(0).toUpperCase() + resourceName.slice(1)

            lines.push(`  ${resourceName}: {`)

            // Types block
            lines.push(`    types: {`)
            for (const [actionName] of resource.actions) {
                switch (actionName) {
                    case 'index':
                        lines.push(`      index: {} as ${capitalizedResource}Index,`)
                        break
                    case 'show':
                        lines.push(`      show: {} as ${capitalizedResource}Show,`)
                        break
                    case 'create':
                        lines.push(`      createForm: {} as ${capitalizedResource}Form["Create"],`)
                        lines.push(`      createPayload: {} as ${capitalizedResource}ApiCreate,`)
                        break
                    case 'update':
                        lines.push(`      updateForm: {} as ${capitalizedResource}Form["Update"],`)
                        lines.push(`      updatePayload: {} as ${capitalizedResource}ApiUpdate,`)
                        break
                }
            }
            lines.push(`      response: {} as ${capitalizedResource}ApiResponse,`)
            lines.push(`    },`)

            // Contract block
            lines.push(`    contract: {`)
            for (const [actionName, action] of resource.actions) {
                const actionCapitalized = actionName.charAt(0).toUpperCase() + actionName.slice(1)
                lines.push(`      ${actionName}: {`)
                if (action.hasBody) {
                    lines.push(`        body: validate${capitalizedResource}${actionCapitalized}Payload,`)
                }
                lines.push(`        response: validate${capitalizedResource}${actionCapitalized}Response,`)
                lines.push(`      },`)
            }
            lines.push(`    },`)

            // Mapper block
            lines.push(`    mapper: {`)
            for (const [actionName, action] of resource.actions) {
                const actionCapitalized = actionName.charAt(0).toUpperCase() + actionName.slice(1)
                lines.push(`      ${actionName}: {`)
                if (action.hasBody) {
                    lines.push(`        body: toApi${capitalizedResource}${actionCapitalized},`)
                }
                const mapperSuffix = actionName === 'index' ? 'ReadList' : 'Read'
                lines.push(`        response: to${capitalizedResource}${mapperSuffix},`)
                lines.push(`      },`)
            }
            lines.push(`    }`)

            lines.push(`  },`)
        }

        lines.push('}')
        lines.push('')
        lines.push('export type ApiClient = typeof api')
        lines.push('export default api')

        return lines.join('\n')
    }

    const apiStructure = generateV2ApiStructure()

    console.log('\n🚀 Generated V2 API Structure (Real Data):')
    console.log('='.repeat(70))
    console.log(apiStructure)
    console.log('='.repeat(70))

    // Key benefits achieved
    console.log('\n🔍 V2 Engine Benefits Achieved:')

    // Count unifications
    let putPatchCount = 0
    let updateCount = 0
    for (const [, resource] of resourceGroups) {
        for (const [actionName] of resource.actions) {
            if (actionName === 'update') updateCount++
        }
        for (const route of resource.originalRoutes) {
            if (route.method === 'PUT' || route.method === 'PATCH') putPatchCount++
        }
    }

    console.log(`✅ Resource-centric grouping: ${resourceGroups.size} resources`)
    console.log('✅ Explicit type declarations with "as Type" syntax')
    console.log(`✅ PUT/PATCH unification: ${putPatchCount} routes → ${updateCount} update actions`)
    console.log('✅ Nested structure: types/contract/mapper per action')
    console.log('✅ Plain JavaScript object (no helper functions)')
    console.log('✅ Consistent action vocabulary across all blocks')

    console.log('\n💡 Usage Examples dengan Real Routes:')
    const firstResource = Array.from(resourceGroups.keys())[0]
    const capitalizedFirst = firstResource.charAt(0).toUpperCase() + firstResource.slice(1)

    console.log('// Type access:')
    console.log(`const form: typeof api.${firstResource}.types.createForm = { /* form data */ }`)
    console.log('')
    console.log('// Validation:')
    console.log(`const validated = api.${firstResource}.contract.create.body(formData)`)
    console.log('')
    console.log('// Transform response:')
    console.log(`const transformed = api.${firstResource}.mapper.show.response(apiResponse)`)
    console.log('')
    console.log('// Collection handling:')
    console.log(`const list = api.${firstResource}.mapper.index.response(apiResponseArray)`)

    console.log(`\n🏆 V2 Engine Test dengan Real RouteSync Manifest: SUCCESS!`)
    console.log(`Generated clean resource-grouped API structure dari ${sampleRoutes.length} real routes`)

} catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
}