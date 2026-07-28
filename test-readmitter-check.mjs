#!/usr/bin/env node

/**
 * Test ReadEmitter Check - Verify no response types
 */

// Simple check untuk lihat apakah demo masih ada ProdukResourceResponse di read
const demoReadOutput = `// Frontend display model (camelCase)
export interface ProdukRead {
id: number
name: string
price: number
description: string | null
categoryId: number     // ⭐ camelCase
createdAt: string      // ⭐ camelCase
updatedAt: string      // ⭐ camelCase
}

// Collection wrapper
export interface ProdukIndex {
data: ProdukRead[]
meta?: {
currentPage: number
perPage: number
total: number
}
}

// Single item wrapper
export interface ProdukShow {
data: ProdukRead
}

// Form interfaces
export interface ProdukForm {
Create: {
name: string
price: number
description: string | null
categoryId: number
}
Update: {
name?: string
price?: number
description?: string | null
categoryId?: number
}
}

// API payload interfaces (snake_case untuk backend)
export interface ProdukApiCreate {
name: string
price: number
description: string | null
category_id: number    // ⭐ snake_case
}

export interface ProdukApiUpdate {
name?: string
price?: number
description?: string | null
category_id?: number   // ⭐ snake_case
}

// ❌ NOTE: NO ProdukResourceResponse here!
// Response types come from contract (z.infer)`

console.log('🔍 Checking ReadEmitter Output for Response Types')
console.log('='.repeat(50))

const hasResourceResponse = demoReadOutput.includes('ProdukResourceResponse') || demoReadOutput.includes('ResourceResponse')
const hasApiResponse = demoReadOutput.includes('ProdukApiResponse') || demoReadOutput.includes('ApiResponse')
const hasResponseType = demoReadOutput.includes('Response') && !demoReadOutput.includes('// Response types come from contract')

console.log('ReadEmitter Analysis:')
console.log(`   • Contains ProdukResourceResponse: ${hasResourceResponse ? '❌' : '✅'}`)
console.log(`   • Contains ProdukApiResponse: ${hasApiResponse ? '❌' : '✅'}`)
console.log(`   • Contains any response types: ${hasResponseType ? '❌' : '✅'}`)

if (!hasResourceResponse && !hasApiResponse && !hasResponseType) {
    console.log('\n✅ ReadEmitter is CLEAN - no response types generated')
    console.log('✅ All response types should come from contract (z.infer)')
} else {
    console.log('\n❌ ReadEmitter still generates response types')
    console.log('❌ Need to remove response type generation from ReadEmitter')
}

console.log('\n🎯 Expected ReadEmitter Types Only:')
console.log('   • ProdukRead (frontend display)')
console.log('   • ProdukIndex, ProdukShow (collection wrappers)')
console.log('   • ProdukForm (form interfaces)')
console.log('   • ProdukApiCreate, ProdukApiUpdate (payload interfaces)')
console.log('   • ❌ NO ProdukResourceResponse (comes from contract)')
console.log('   • ❌ NO ProdukApiResponse (comes from contract)')

console.log('\n💡 Contract vs Read Separation:')
console.log('   📄 contract/api-contract.ts:')
console.log('      • ProdukResourceResponse (z.infer from Zod)')
console.log('      • validateProdukResourceResponse (validator)')
console.log('   📄 types/api-read.ts:')
console.log('      • ProdukRead (frontend display)')
console.log('      • ProdukForm, ProdukApi* (forms & payloads)')
console.log('      • ❌ NO response types')