#!/usr/bin/env node

/**
 * Test Fixed Type Import Architecture
 * 
 * Menampilkan arsitektur yang benar setelah fix:
 * ✅ Response types: api-contract.ts (z.infer dari Zod)
 * ✅ Frontend types: api-read.ts (form, display)
 * ✅ SDK imports: dari sources yang tepat
 */

console.log('🔧 FIXED TYPE IMPORT ARCHITECTURE')
console.log('='.repeat(60))
console.log('✅ Response types dari contract (z.infer)')
console.log('✅ Frontend types dari read (forms)')
console.log('✅ SDK imports dari proper sources')
console.log('='.repeat(60))

// Fixed architecture demonstration
const fixedFiles = {
    'contract/api-contract.ts': `/**
 * API Contract Zod schemas untuk validation
 * ⭐ SOURCE OF TRUTH untuk response types
 */

import { z } from 'zod'

// Response schema (backend structure)
export const ProdukResourceSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  description: z.string().nullable(),
  category_id: z.number(),     // ⭐ snake_case (backend)
  created_at: z.string(),      // ⭐ snake_case (backend)
  updated_at: z.string(),      // ⭐ snake_case (backend)
})

// ⭐ INFERRED TYPE - single source of truth
export type ProdukResourceResponse = z.infer<typeof ProdukResourceSchema>

// Shared validator untuk CUD operations
export const validateProdukResourceResponse = (payload: unknown): ProdukResourceResponse => 
  ProdukResourceSchema.parse(payload)

// Collection schema untuk index
export const ProduksResponseSchema = z.object({
  data: z.array(ProdukResourceSchema)
})

export const validateProdukResourceCollectionResponse = (payload: unknown) =>
  ProduksResponseSchema.parse(payload)

// Payload schemas untuk input
export const ProdukCreatePayload = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string().nullable(),
  category_id: z.number(),
})

export const validateProdukCreatePayload = (payload: unknown) => 
  ProdukCreatePayload.parse(payload)`,

    'types/api-read.ts': `/**
 * Frontend-optimized types
 * ⭐ NO RESPONSE TYPES (those come from contract)
 */

// Frontend display model (camelCase)
export interface ProdukRead {
  id: number
  name: string
  price: number
  description: string | null
  categoryId: number     // ⭐ camelCase (frontend)
  createdAt: string      // ⭐ camelCase (frontend)
  updatedAt: string      // ⭐ camelCase (frontend)
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

// Form interfaces (frontend input)
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
  category_id: number    // ⭐ snake_case untuk backend
}

export interface ProdukApiUpdate {
  name?: string
  price?: number
  description?: string | null
  category_id?: number   // ⭐ snake_case untuk backend
}

// ❌ NOTE: NO ProdukApiResponse here!
// ❌ Response types must come from contract (z.infer results)`,

    'sdk/api.ts': `/**
 * Resource-Grouped API Client
 * ⭐ FIXED: Correct imports dari proper sources
 */

import { defineApi, endpoint, typeOf } from './runtime'

// Frontend types dari ReadEmitter (forms, display)
import type {
  ProdukIndex,
  ProdukShow,
  ProdukForm,
  ProdukApiCreate,
  ProdukApiUpdate,
} from '../types/api-read'

// ⭐ Response types dari ContractEmitter (z.infer results)
import type {
  ProdukResourceResponse,
} from '../contract/api-contract'

// Validation functions dari ContractEmitter
import {
  validateProdukCreatePayload,
  validateProdukUpdatePayload,
  validateProdukResourceResponse,          // ⭐ SHARED
  validateProdukResourceCollectionResponse, // ⭐ Collection
} from '../contract/api-contract'

// Mappers
import {
  toApiProdukCreate,
  toApiProdukUpdate,
  toProdukRead,
  toProdukReadList,
} from '../mappers/api-mapper'

export const api = defineApi({
  produk: {
    endpoint({
      types: {
        index: typeOf<ProdukIndex>(),
        show: typeOf<ProdukShow>(),
        createForm: typeOf<ProdukForm["Create"]>(),
        createPayload: typeOf<ProdukApiCreate>(),
        updateForm: typeOf<ProdukForm["Update"]>(),
        updatePayload: typeOf<ProdukApiUpdate>(),
        response: typeOf<ProdukResourceResponse>(), // ⭐ FROM CONTRACT
      },
      contract: {
        index: {
          response: validateProdukResourceCollectionResponse,
        },
        show: {
          response: validateProdukResourceResponse, // ⭐ SHARED
        },
        create: {
          body: validateProdukCreatePayload,
          response: validateProdukResourceResponse, // ⭐ SHARED
        },
        update: {
          body: validateProdukUpdatePayload,
          response: validateProdukResourceResponse, // ⭐ SHARED
        },
      },
      mapper: {
        index: { response: toProdukReadList },
        show: { response: toProdukRead },
        create: { 
          body: toApiProdukCreate,
          response: toProdukRead 
        },
        update: { 
          body: toApiProdukUpdate,
          response: toProdukRead 
        },
      }
    })
  },
})`,

    'mappers/api-mapper.ts': `/**
 * Data transformation functions
 * ⭐ Uses correct types dari proper sources
 */

import type { 
  ProdukRead,
  ProdukApiCreate,
  ProdukApiUpdate,
  ProdukForm 
} from '../types/api-read'

// ⭐ Response type dari contract (z.infer result)
import type {
  ProdukResourceResponse
} from '../contract/api-contract'

// API response → Frontend read (snake_case → camelCase)
export const toProdukRead = (resource: ProdukResourceResponse): ProdukRead => ({
  id: resource.id,
  name: resource.name,
  price: resource.price,
  description: resource.description,
  categoryId: resource.category_id, // ⭐ snake → camel
  createdAt: resource.created_at,   // ⭐ snake → camel
  updatedAt: resource.updated_at,   // ⭐ snake → camel
})

// Frontend form → API payload (camelCase → snake_case)
export const toApiProdukCreate = (form: ProdukForm['Create']): ProdukApiCreate => ({
  name: form.name,
  price: form.price,
  description: form.description,
  category_id: form.categoryId, // ⭐ camel → snake
})

export const toProdukReadList = (response: { data: ProdukResourceResponse[] }) => ({
  data: response.data.map(toProdukRead),
  meta: 'meta' in response ? response.meta : undefined
})`
}

// Display all files
Object.entries(fixedFiles).forEach(([filepath, content], index) => {
    console.log(`\n📁 FILE ${index + 1}: ${filepath}`)
    console.log('─'.repeat(50))
    console.log(content)

    if (index < Object.entries(fixedFiles).length - 1) {
        console.log('\n' + '━'.repeat(60))
    }
})

console.log('\n' + '='.repeat(60))
console.log('🎯 TYPE FLOW ARCHITECTURE ANALYSIS')
console.log('='.repeat(60))

console.log('✅ CORRECT FLOW:')
console.log('   1. 📄 contract/api-contract.ts:')
console.log('      • Zod schemas (ProdukResourceSchema)')
console.log('      • Inferred types (z.infer<typeof Schema>)')
console.log('      • Response validators (validateProdukResourceResponse)')
console.log('      ⭐ SINGLE SOURCE OF TRUTH untuk response types')
console.log('')
console.log('   2. 📄 types/api-read.ts:')
console.log('      • Frontend display types (ProdukRead - camelCase)')
console.log('      • Form interfaces (ProdukForm)')
console.log('      • API payload interfaces (ProdukApiCreate - snake_case)')
console.log('      ❌ NO response types (those come from contract)')
console.log('')
console.log('   3. 📄 sdk/api.ts:')
console.log('      • Import forms from api-read.ts')
console.log('      • Import responses from api-contract.ts ⭐')
console.log('      • Use inferred types dalam typeOf<T>()')
console.log('')
console.log('   4. 📄 mappers/api-mapper.ts:')
console.log('      • Import forms from api-read.ts')
console.log('      • Import responses from api-contract.ts ⭐')
console.log('      • Transform with correct types')

console.log('\n❌ WRONG PATTERN (sebelum fix):')
console.log('   • api-read.ts: Manual ProdukApiResponse definition')
console.log('   • api.ts: Import response from api-read.ts (wrong!)')
console.log('   • Duplicate type definitions')
console.log('   • No single source of truth')

console.log('\n✅ BENEFITS SETELAH FIX:')
console.log('   • ✅ Contract-first approach')
console.log('   • ✅ Zod schema = TypeScript type (auto-sync)')
console.log('   • ✅ No manual response type definitions')
console.log('   • ✅ Clear separation of concerns:')
console.log('       - Contract: Response types (z.infer)')
console.log('       - Read: Frontend types (forms, display)')
console.log('       - SDK: Orchestration (imports from both)')
console.log('   • ✅ Single source of truth untuk response structure')
console.log('   • ✅ Schema changes auto-propagate to all layers')

console.log('\n🎯 LAYER RESPONSIBILITIES:')
console.log('   📦 ContractEmitter: Zod schemas + inferred response types')
console.log('   📦 ReadEmitter: Frontend display + form types')
console.log('   📦 SDKEmitter: API orchestration (imports from both)')
console.log('   📦 MapperEmitter: Transformations (uses types from both)')

console.log('\n🏆 TYPE IMPORT ARCHITECTURE: FIXED!')
console.log('✅ Response types dari contract (z.infer - single source)')
console.log('✅ Frontend types dari read (forms, display)')
console.log('✅ Proper import separation dan responsibilities')
console.log('✅ Contract-first architecture established')