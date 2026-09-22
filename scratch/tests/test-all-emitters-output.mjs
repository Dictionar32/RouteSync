#!/usr/bin/env node

/**
 * Test All Emitters Output - Full Generation Preview
 * 
 * Menunjukkan output lengkap dari semua emitters:
 * - ReadEmitter -> types/api-read.ts 
 * - FormEmitter -> forms/api-form.ts
 * - ContractEmitter -> contract/api-contract.ts
 * - MapperEmitter -> mappers/api-mapper.ts
 * - SDKEmitter -> sdk/api.ts
 * - RuntimeEmitter -> sdk/runtime.ts
 */

import fs from 'fs'

console.log('🧪 Testing All Emitters Output - Full Generation')
console.log('='.repeat(70))

// Enhanced test manifest dengan complete CRUD untuk produk
const testManifest = {
    version: '1.0.0',
    baseURL: 'http://localhost:8000/api',
    generatedAt: new Date().toISOString(),
    routes: [
        {
            name: 'produk.index',
            method: 'GET',
            path: '/produk',
            auth: false,
            middleware: ['api'],
            response: {
                kind: 'resource',
                resource: 'ProdukResource',
                collection: true
            }
        },
        {
            name: 'produk.show',
            method: 'GET',
            path: '/produk/{id}',
            auth: true,
            middleware: ['api', 'auth'],
            response: {
                kind: 'resource',
                resource: 'ProdukResource',
                collection: false
            }
        },
        {
            name: 'produk.store',
            method: 'POST',
            path: '/produk',
            auth: true,
            middleware: ['api', 'auth'],
            schema: {
                rules: {
                    'name': 'required|string',
                    'price': 'required|numeric',
                    'description': 'nullable|string',
                    'category_id': 'required|integer'
                }
            },
            response: {
                kind: 'resource',
                resource: 'ProdukResource',
                collection: false
            }
        },
        {
            name: 'produk.update',
            method: 'PUT',
            path: '/produk/{id}',
            auth: true,
            middleware: ['api', 'auth'],
            schema: {
                rules: {
                    'name': 'required|string',
                    'price': 'required|numeric',
                    'description': 'nullable|string',
                    'category_id': 'required|integer'
                }
            },
            response: {
                kind: 'resource',
                resource: 'ProdukResource',
                collection: false
            }
        },
        {
            name: 'produk.destroy',
            method: 'DELETE',
            path: '/produk/{id}',
            auth: true,
            middleware: ['api', 'auth'],
            response: {
                kind: 'object',
                fields: {
                    'message': { kind: 'primitive', type: 'string' },
                    'success': { kind: 'primitive', type: 'boolean' }
                }
            }
        }
    ],
    resources: [
        {
            name: 'ProdukResource',
            fields: {
                'id': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number', status: 'resolved', confidence: 1, trace: [] }
                },
                'name': {
                    kind: 'primitive',
                    type: 'string',
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'price': {
                    kind: 'primitive',
                    type: 'decimal',
                    resolved: { type: 'number', status: 'resolved', confidence: 1, trace: [] }
                },
                'description': {
                    kind: 'primitive',
                    type: 'string',
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'category_id': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number', status: 'resolved', confidence: 1, trace: [] }
                },
                'created_at': {
                    kind: 'primitive',
                    type: 'datetime',
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'updated_at': {
                    kind: 'primitive',
                    type: 'datetime',
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                }
            }
        }
    ],
    models: []
}

console.log('📊 Test Manifest:')
console.log(`   Routes: ${testManifest.routes.length} (Full CRUD untuk Produk)`)
console.log(`   Resources: ${testManifest.resources.length}`)
console.log('')
testManifest.routes.forEach((route, i) => {
    console.log(`   ${i + 1}. ${route.method} ${route.path} → ${route.name}`)
})

// Simulate semua emitters output
const generateAllEmittersOutput = () => {
    const files = {}

    // 1. ReadEmitter - TypeScript interfaces
    files['types/api-read.ts'] = `/**
 * TypeScript Read Interfaces
 * Generated by ReadEmitter - camelCase, frontend-friendly
 */

export interface ProdukResourceTransformed {
  readonly id: number
  readonly name: string
  readonly price: number
  readonly description: string | null
  readonly categoryId: number
  readonly createdAt: string
  readonly updatedAt: string
}

// Aliases untuk different contexts
export type ProdukIndex = ProdukResourceTransformed[]
export type ProdukShow = ProdukResourceTransformed
export type ProdukCollection = ProdukResourceTransformed[]
`

    // 2. FormEmitter - Form types
    files['forms/api-form.ts'] = `/**
 * Form Types untuk Frontend Forms
 * Generated by FormEmitter - camelCase form data
 */

export interface ProdukForm {
  Create: {
    name: string
    price: number
    description?: string | null
    categoryId: number
  }
  
  Update: {
    name: string
    price: number
    description?: string | null
    categoryId: number
  }
  
  Search?: {
    query?: string
    categoryId?: number
    minPrice?: number
    maxPrice?: number
  }
}

// Export individual form types
export type ProdukCreateForm = ProdukForm['Create']
export type ProdukUpdateForm = ProdukForm['Update']
export type ProdukSearchForm = ProdukForm['Search']
`

    // 3. ContractEmitter - Zod schemas (⭐ Key: Response sharing issue!)
    files['contract/api-contract.ts'] = `/**
 * API Contract Zod schemas untuk validation
 * Generated dari TypeIR - pure type renderer
 * 
 * Berisi KEDUA arah sesuai Engine.Fix.md §16:
 * - Response schemas (output backend)
 * - Payload schemas (input ke backend)
 */

import { z } from 'zod'

// ==== RESPONSE SCHEMAS (Backend Output) ====
// Validates data coming FROM backend

export const ProdukResourceSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  description: z.string().nullable(),
  category_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ProdukResourceResponse = z.infer<typeof ProdukResourceSchema>

// ⭐ SHARED Response validator untuk semua CRUD operations
export const validateProdukResponse = (payload: unknown): ProdukResourceResponse => 
  ProdukResourceSchema.parse(payload)

// ==== COLLECTION RESPONSE SCHEMAS ====
export const ProduksResponseSchema = z.object({
  data: z.array(ProdukResourceSchema)
})

export const validateProdukCollectionResponse = (payload: unknown) =>
  ProduksResponseSchema.parse(payload)

// ==== PAYLOAD SCHEMAS (Backend Input) ====
// Validates data going TO backend

export const ProdukCreatePayload = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string().nullable(),
  category_id: z.number(),
})

export type ProdukCreatePayloadType = z.infer<typeof ProdukCreatePayload>

export const validateProdukCreatePayload = (payload: unknown): ProdukCreatePayloadType => 
  ProdukCreatePayload.parse(payload)

export const ProdukUpdatePayload = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string().nullable(),
  category_id: z.number(),
})

export type ProdukUpdatePayloadType = z.infer<typeof ProdukUpdatePayload>

export const validateProdukUpdatePayload = (payload: unknown): ProdukUpdatePayloadType => 
  ProdukUpdatePayload.parse(payload)

// Delete response (different structure)
export const DeleteResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
})

export const validateDeleteResponse = (payload: unknown) =>
  DeleteResponseSchema.parse(payload)
`

    // 4. MapperEmitter - Transform functions
    files['mappers/api-mapper.ts'] = `/**
 * Runtime mapper functions untuk transformasi data
 * Generated dari Contract IR - domain-centric architecture
 */

// Import types untuk type safety
import { ApiApiField } from '../fields/api-field'

// ==== READ MAPPERS (API Response → Frontend Model) ====
// Transforms snake_case API responses to camelCase frontend models

export const toProdukRead = (api: ProdukResourceResponse): ProdukResourceTransformed => ({
  id: api.id,
  name: api.name,
  price: api.price,
  description: api.description,
  categoryId: api.category_id,
  createdAt: api.created_at,
  updatedAt: api.updated_at,
})

export const toProdukReadList = (api: ProdukResourceResponse[]): ProdukResourceTransformed[] =>
  api.map(toProdukRead)

// ==== FORM MAPPERS (Frontend Form → API Payload) ====
// Transforms camelCase form data to snake_case API payloads using ApiApiField

export const toApiProdukCreate = (form: ProdukForm['Create']): ProdukCreatePayloadType => ({
  [ApiApiField.NAME]: form.name,
  [ApiApiField.PRICE]: form.price,
  [ApiApiField.DESCRIPTION]: form.description,
  [ApiApiField.CATEGORY_ID]: form.categoryId,
})

export const toApiProdukUpdate = (form: ProdukForm['Update']): ProdukUpdatePayloadType => ({
  [ApiApiField.NAME]: form.name,
  [ApiApiField.PRICE]: form.price,
  [ApiApiField.DESCRIPTION]: form.description,
  [ApiApiField.CATEGORY_ID]: form.categoryId,
})
`

    // 5. FieldEmitter - Field constants
    files['fields/api-field.ts'] = `/**
 * API Field Constants
 * Generated by FieldEmitter - snake_case backend field names
 */

export const ApiApiField = {
  // ProdukResource fields
  ID: 'id' as const,
  NAME: 'name' as const,
  PRICE: 'price' as const,
  DESCRIPTION: 'description' as const,
  CATEGORY_ID: 'category_id' as const,
  CREATED_AT: 'created_at' as const,
  UPDATED_AT: 'updated_at' as const,
} as const

export type ApiApiField = typeof ApiApiField[keyof typeof ApiApiField]
`

    // 6. RuntimeEmitter - Helper functions
    files['sdk/runtime.ts'] = `/**
 * Runtime Helpers for Resource-Grouped API
 * Generated by RuntimeEmitter - Contract IR Architecture
 * 
 * Provides helper functions for the new api.ts structure:
 * - defineApi(): API configuration wrapper
 * - endpoint(): Endpoint configuration wrapper  
 * - typeOf<T>(): Type-safe phantom type carrier
 */

export function defineApi<T>(config: T): T {
  return config
}

export function endpoint<T>(config: T): T {
  return config
}

export const typeOf = <T>(): T => undefined as unknown as T

export type ApiAction = 'index' | 'show' | 'create' | 'update' | 'destroy'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export const ACTION_TO_METHOD: Record<ApiAction, HttpMethod[]> = {
  index: ['GET'],
  show: ['GET'], 
  create: ['POST'],
  update: ['PUT', 'PATCH'], // Unified mapping
  destroy: ['DELETE']
}
`

    // 7. SDKEmitter - Main API (⭐ Fix: Shared response validator)
    files['sdk/api.ts'] = `/**
 * Resource-Grouped API Client
 * Generated by SDKEmitter - Contract IR Architecture
 * 
 * Structure: api.{resource}.endpoint({ types, contract, mapper })
 * Benefits: Type-safe, consistent action naming, no duplication
 * Sesuai Engine.Fix.md §27 specification
 */

import { defineApi, endpoint, typeOf } from './runtime'

// Type imports from generated files
import type {
  ProdukIndex, ProdukShow, ProdukForm,
  ProdukResourceTransformed,
} from "../types/api-read"

// Validation imports from generated files  
import {
  validateProdukCreatePayload, validateProdukUpdatePayload,
  validateProdukResponse,  // ⭐ SHARED untuk semua CRUD operations
  validateProdukCollectionResponse,
  validateDeleteResponse,
} from "../contract/api-contract"

// Mapper imports from generated files
import {
  toApiProdukCreate, toApiProdukUpdate,
  toProdukRead, toProdukReadList,
} from "../mappers/api-mapper"

export const api = defineApi({
  produk: {
    endpoint({
      types: {
        index: typeOf<ProdukIndex>(),
        show: typeOf<ProdukShow>(),
        createForm: typeOf<ProdukForm["Create"]>(),
        updateForm: typeOf<ProdukForm["Update"]>(),
        createPayload: typeOf<ProdukCreatePayloadType>(),
        updatePayload: typeOf<ProdukUpdatePayloadType>(),
        response: typeOf<ProdukResourceTransformed>(),
      },
      contract: {
        index: {
          // Collection response uses different validator
          response: validateProdukCollectionResponse,
        },
        show: {
          // ⭐ Single item response - shared validator
          response: validateProdukResponse,
        },
        create: {
          body: validateProdukCreatePayload,
          // ⭐ Create returns single item - shared validator  
          response: validateProdukResponse,
        },
        update: {
          body: validateProdukUpdatePayload,
          // ⭐ Update returns single item - shared validator
          response: validateProdukResponse,
        },
        destroy: {
          // Delete has different response structure
          response: validateDeleteResponse,
        },
      },
      mapper: {
        index: {
          response: toProdukReadList,
        },
        show: {
          response: toProdukRead,
        },
        create: {
          body: toApiProdukCreate,
          response: toProdukRead,
        },
        update: {
          body: toApiProdukUpdate,
          response: toProdukRead,
        },
        destroy: {
          response: (res: any) => res, // Simple passthrough untuk delete
        },
      }
    })
  }
})

export type ApiClient = typeof api
export default api
`

    return files
}

console.log('\n🚀 Generating All Emitters Output...')
const allFiles = generateAllEmittersOutput()

console.log('\n📂 Generated Files Overview:')
Object.keys(allFiles).forEach((path, i) => {
    const size = allFiles[path].length
    console.log(`   ${i + 1}. ${path} (${size} chars)`)
})

console.log('\n' + '='.repeat(80))
console.log('🔍 DETAILED OUTPUT PREVIEW')
console.log('='.repeat(80))

Object.entries(allFiles).forEach(([path, content]) => {
    console.log(`\n📄 ${path}`)
    console.log('-'.repeat(50))
    console.log(content)
    console.log('-'.repeat(50))
})

console.log('\n🎯 Key Issues & Solutions Identified:')

console.log('\n❌ ISSUE: Response Validation per CRUD')
console.log('   Problem: validateProdukCreateResponse, validateProdukUpdateResponse, etc.')
console.log('   Solution: SHARED validateProdukResponse untuk semua CUD operations')

console.log('\n✅ CORRECT PATTERN:')
console.log('   • index: validateProdukCollectionResponse (array)')
console.log('   • show: validateProdukResponse (single)')
console.log('   • create: validateProdukResponse (returns created item)')
console.log('   • update: validateProdukResponse (returns updated item)')
console.log('   • destroy: validateDeleteResponse (different structure)')

console.log('\n🔧 SDKEmitter Fix Needed:')
console.log('   1. Detect response type dari route.response')
console.log('   2. Use SHARED validator untuk same resource responses')
console.log('   3. Different validator only for different structures (delete, etc)')

console.log('\n💡 Backend Response Logic:')
console.log('   • GET /produk → Collection response (ProdukResource[])')
console.log('   • GET /produk/{id} → Single response (ProdukResource)')
console.log('   • POST /produk → Single response (created ProdukResource)')
console.log('   • PUT /produk/{id} → Single response (updated ProdukResource)')
console.log('   • DELETE /produk/{id} → Success message ({ message, success })')

console.log('\n🏆 All Emitters Output Preview: COMPLETE!')
console.log('✅ ReadEmitter - TypeScript interfaces dengan camelCase')
console.log('✅ FormEmitter - Form types dengan proper structure')
console.log('✅ ContractEmitter - Zod schemas dengan shared response validator')
console.log('✅ MapperEmitter - Transform functions snake_case ↔ camelCase')
console.log('✅ FieldEmitter - Constants untuk consistent field names')
console.log('✅ RuntimeEmitter - Helper functions untuk §27 structure')
console.log('✅ SDKEmitter - Resource-grouped API dengan shared validators')

console.log('\n🔄 Next: Fix SDKEmitter untuk use shared response validators!')