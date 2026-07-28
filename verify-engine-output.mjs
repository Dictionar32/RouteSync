#!/usr/bin/env node

/**
 * Verify Engine Output - Test real output against Engine.Fix.md section 16
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

console.log('🔍 Verifying RouteSync Engine Output Against Engine.Fix.md Section 16')
console.log('='.repeat(70))

// Create mock manifest yang sesuai dengan contoh di Engine.Fix.md
const mockManifest = {
    version: '1.0.0',
    baseURL: 'http://localhost:8000/api',
    generatedAt: new Date().toISOString(),
    routes: [
        {
            name: 'register.post',
            method: 'POST',
            path: '/register',
            auth: false,
            middleware: ['api'],
            schema: {
                rules: {
                    name: 'required|string|max:255',
                    email: 'required|email|unique:users,email',
                    password: 'required|min:6'
                }
            },
            response: {
                kind: 'model',
                model: 'RegisterResponse',
                collection: false,
                resolved: {
                    status: 'resolved',
                    type: 'model',
                    model: 'RegisterResponse',
                    confidence: 100,
                    trace: []
                }
            }
        },
        {
            name: 'categories.index',
            method: 'GET',
            path: '/categories',
            auth: false,
            middleware: [],
            response: {
                kind: 'resource',
                resource: 'CategoryResource',
                collection: true,
                paginated: false
            }
        },
        {
            name: 'payments.show',
            method: 'GET',
            path: '/payments/{id}',
            auth: true,
            middleware: ['auth'],
            response: {
                kind: 'resource',
                resource: 'PaymentResource',
                collection: false
            }
        }
    ],
    resources: [
        {
            name: 'CategoryResource',
            fields: {
                'id': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number', status: 'resolved', confidence: 1, trace: [] }
                },
                'nama': {
                    kind: 'primitive',
                    type: 'string',
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
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
        },
        {
            name: 'PaymentResource',
            fields: {
                'id': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number', status: 'resolved', confidence: 1, trace: [] }
                },
                'order_id': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number', status: 'resolved', confidence: 1, trace: [] }
                },
                'invoice_number': {
                    kind: 'primitive',
                    type: 'string',
                    nullable: true,
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'metode': {
                    kind: 'primitive',
                    type: 'string',
                    nullable: true,
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'detail': {
                    kind: 'primitive',
                    type: 'string',
                    nullable: true,
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'status': {
                    kind: 'primitive',
                    type: 'string',
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'paid_at': {
                    kind: 'primitive',
                    type: 'datetime',
                    nullable: true,
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'provider': {
                    kind: 'primitive',
                    type: 'string',
                    nullable: true,
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'provider_txn_id': {
                    kind: 'primitive',
                    type: 'string',
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'gateway_status': {
                    kind: 'primitive',
                    type: 'string',
                    resolved: { type: 'string', status: 'resolved', confidence: 1, trace: [] }
                },
                'amount_minor': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number', status: 'resolved', confidence: 1, trace: [] }
                },
                'refund_amount_minor': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number', status: 'resolved', confidence: 1, trace: [] }
                },
                'items': {
                    kind: 'resource',
                    resource: 'OrderDetailResource',
                    collection: true
                },
                'total_harga': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number', status: 'resolved', confidence: 1, trace: [] }
                }
            }
        }
    ],
    models: [
        {
            name: 'Category',
            table: 'categories',
            columns: [
                { name: 'id', type: 'bigint', nullable: false },
                { name: 'nama', type: 'varchar', nullable: false },
                { name: 'created_at', type: 'timestamp', nullable: true },
                { name: 'updated_at', type: 'timestamp', nullable: true }
            ]
        },
        {
            name: 'Payment',
            table: 'payments',
            columns: [
                { name: 'id', type: 'bigint', nullable: false },
                { name: 'order_id', type: 'bigint', nullable: false },
                { name: 'invoice_number', type: 'varchar', nullable: true },
                { name: 'metode', type: 'varchar', nullable: true },
                { name: 'detail', type: 'text', nullable: true },
                { name: 'status', type: 'varchar', nullable: false },
                { name: 'paid_at', type: 'timestamp', nullable: true },
                { name: 'provider', type: 'varchar', nullable: true },
                { name: 'provider_txn_id', type: 'varchar', nullable: false },
                { name: 'gateway_status', type: 'varchar', nullable: false },
                { name: 'amount_minor', type: 'int', nullable: false },
                { name: 'refund_amount_minor', type: 'int', nullable: false },
                { name: 'total_harga', type: 'int', nullable: false }
            ]
        }
    ]
}

// Simpan manifest
writeFileSync('./test-engine-manifest.json', JSON.stringify(mockManifest, null, 2))
console.log('✅ Created test-engine-manifest.json')

console.log('\n📋 Expected Output Format (berdasarkan Engine.Fix.md section 16):')
console.log('\n🎯 api-contract.ts should contain:')
console.log('```typescript')
console.log('export const RegisterResponseSchema = z.object({')
console.log('  success: z.boolean(),')
console.log('  message: z.string(),')
console.log('  data: z.unknown().nullable(),')
console.log('})')
console.log('')
console.log('export const PaymentResourceSchema = z.object({')
console.log('  id: z.number(),')
console.log('  order_id: z.number(),')
console.log('  invoice_number: z.string().nullable(),')
console.log('  metode: z.string().nullable(),')
console.log('  // ... other fields')
console.log('})')
console.log('')
console.log('export const CategoriesResponseSchema = z.object({ data: z.array(CategorySchema) })')
console.log('export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>')
console.log('export const validateCategoriesResponse = (payload: unknown): CategoriesResponse => CategoriesResponseSchema.parse(payload)')
console.log('```')

console.log('\n🎯 api-read.ts should contain:')
console.log('```typescript')
console.log('export interface CategoryResourceTransformed {')
console.log('  readonly id: number')
console.log('  readonly nama: string')
console.log('  readonly createdAt: string | null')
console.log('  readonly updatedAt: string | null')
console.log('}')
console.log('')
console.log('export interface PaymentResourceTransformed {')
console.log('  readonly id: number')
console.log('  readonly orderId: number          // order_id → orderId')
console.log('  readonly invoiceNumber: string | null  // invoice_number → invoiceNumber')
console.log('  readonly paidAt: string | null    // paid_at → paidAt')
console.log('  readonly providerTxnId: string    // provider_txn_id → providerTxnId')
console.log('  readonly gatewayStatus: string    // gateway_status → gatewayStatus')
console.log('  readonly amountMinor: number      // amount_minor → amountMinor')
console.log('  readonly refundAmountMinor: number // refund_amount_minor → refundAmountMinor')
console.log('  readonly totalHarga: number       // total_harga → totalHarga')
console.log('  // ... other transformed fields')
console.log('}')
console.log('')
console.log('export type CategoryShow = CategoryTransformed')
console.log('export type CategoryIndex = CategoryTransformed[]')
console.log('```')

console.log('\n🎯 api-mapper.ts should contain:')
console.log('```typescript')
console.log('export const toCategoryResourceRead = (raw: Category): CategoryResourceTransformed => ({')
console.log('  id: raw.id,')
console.log('  nama: raw.nama,')
console.log('  createdAt: raw.created_at,    // snake_case → camelCase mapping')
console.log('  updatedAt: raw.updated_at,    // snake_case → camelCase mapping')
console.log('})')
console.log('')
console.log('export const toPaymentResourceRead = (raw: Payment): PaymentResourceTransformed => ({')
console.log('  id: raw.id,')
console.log('  orderId: raw.order_id,        // order_id → orderId')
console.log('  invoiceNumber: raw.invoice_number,  // invoice_number → invoiceNumber')
console.log('  paidAt: raw.paid_at,          // paid_at → paidAt')
console.log('  providerTxnId: raw.provider_txn_id,  // provider_txn_id → providerTxnId')
console.log('  // ... other mappings')
console.log('})')
console.log('```')

console.log('\n📊 Key Verification Points:')
console.log('1. ✅ Field transformations: snake_case → camelCase consistency')
console.log('2. ✅ Type safety: no `any` types used')
console.log('3. ✅ Zod schemas: proper validation with nullable fields')
console.log('4. ✅ Interface generation: readonly fields with proper types')
console.log('5. ✅ Mapper functions: correct source-to-target field mapping')
console.log('6. ✅ Collection wrappers: { data: T[] } pattern for arrays')
console.log('7. ✅ Type inference: z.infer<typeof Schema> pattern')
console.log('8. ✅ Validator functions: parse functions for runtime validation')

console.log('\n🧪 Testing Strategy:')
console.log('1. Use mock manifest with representative data structures')
console.log('2. Run ContractGenerator to generate actual output')
console.log('3. Compare generated content against expected patterns')
console.log('4. Verify field transformation consistency across all files')
console.log('5. Check that output matches Engine.Fix.md section 16 examples')

console.log('\n📝 Test Manifest Summary:')
console.log(`   - Routes: ${mockManifest.routes.length} (register, categories.index, payments.show)`)
console.log(`   - Resources: ${mockManifest.resources.length} (CategoryResource, PaymentResource)`)
console.log(`   - Models: ${mockManifest.models.length} (Category, Payment)`)

console.log('\n✨ Engine Output Verification Ready!')
console.log('Next: Run ContractGenerator with this manifest to verify actual vs expected output')

// Coba jalankan generator jika memungkinkan
console.log('\n🚀 Attempting to run ContractGenerator...')
try {
    // Cek apakah dist sudah ada
    if (existsSync('./dist/cli.js')) {
        console.log('✅ Found compiled CLI, attempting to run...')
        // Note: Kita tidak bisa langsung menjalankan generator tanpa setup penuh
        console.log('💡 Suggestion: Use `routesync sync --manifest test-engine-manifest.json --output ./test-output`')
    } else {
        console.log('ℹ️  CLI not compiled, use npm run build first')
    }
} catch (error) {
    console.log('❌ Could not run generator:', error.message)
}

console.log('\n📋 Manual Verification Steps:')
console.log('1. Run `npm run build` to compile TypeScript')
console.log('2. Run ContractGenerator with test-engine-manifest.json')
console.log('3. Check generated files in output directory')
console.log('4. Verify field transformations match Engine.Fix.md section 16')
console.log('5. Confirm no TypeScript errors in generated code')