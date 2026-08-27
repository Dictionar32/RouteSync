/**
 * TDD contract test for ApiFieldGeneratorPass (does not exist yet).
 *
 * Split out from MapperGeneratorPass (2026-08-26) per explicit correction:
 * "1 artifact = 1 file" — MapperGeneratorPass originally produced BOTH
 * mappers/api-mapper.ts AND contract/api-field.ts from a single pass/
 * artifact (`.code` + `.fieldTableCode`), which breaks the established
 * pattern (ContractGeneratorPass -> 1 artifact -> api-contract.ts,
 * FormGeneratorPass -> 1 artifact -> api-form.ts).
 *
 * ApiFieldGeneratorPass owns contracts/api-field.ts exclusively:
 *   - Input: RequestTypesArtifact (same single-input pattern as every
 *     other pass in this pipeline).
 *   - Output: GeneratedApiField { code: string } — ONE code string, ONE
 *     file (contracts/api-field.ts).
 *   - Collects every RequestField.originalName across every action of
 *     every RequestType, deduplicated, in first-appearance insertion
 *     order (verified 2026-08-26 against the real project's committed
 *     contracts/api-field.ts — NOT alphabetical).
 *   - Key derivation: originalName.toUpperCase().replace(/_/g, '') —
 *     verified empirically against real output (e.g. 'redirect_to' ->
 *     'REDIRECTTO'); deliberately not FieldEmitter.ts's buggy
 *     camelCaseToSnakeUpper (see docs/investigations/... bagian 11).
 *
 * MapperGeneratorPass (separate pass/file) is expected to only REFERENCE
 * `ApiApiField.<KEY>` as a bare identifier in its own `.code` — it must
 * import it from contracts/api-field.ts at actual file-write time, not
 * define the table itself. See mapper-generator-pass.test.ts (updated
 * 2026-08-26) for that side of the contract.
 */

import { describe, expect, test } from 'vitest'
import { ApiFieldGeneratorPass } from '../ApiFieldGeneratorPass'
import type {
    RequestTypesArtifact,
    RequestType,
} from '../../artifacts/RequestTypesArtifact'

function metadata() {
    return {
        hash: 'test-hash',
        producer: 'test',
        dependencies: [],
        timestamp: Date.now(),
        revision: '1.0.0',
    }
}

function requestTypesArtifact(requestTypes: readonly RequestType[]): RequestTypesArtifact {
    return {
        typeId: 'RequestTypes',
        metadata: metadata(),
        requestTypes,
    }
}

describe('ApiFieldGeneratorPass', () => {
    test('generates exactly one entry per unique originalName, shared across resources/actions', () => {
        const input = requestTypesArtifact([
            {
                resourceName: 'register',
                formTypeName: 'RegisterForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'email',
                                transformedName: 'email',
                                type: { kind: 'primitive', type: 'string' } as never,
                                required: true,
                                nullable: false,
                            },
                        ],
                    },
                ],
            },
            {
                resourceName: 'profile',
                formTypeName: 'ProfileForm',
                actions: [
                    {
                        name: 'update',
                        // Same field name `email` reused on a totally
                        // different resource/action — must NOT produce a
                        // second EMAIL entry.
                        fields: [
                            {
                                originalName: 'email',
                                transformedName: 'email',
                                type: { kind: 'primitive', type: 'string' } as never,
                                required: false,
                                nullable: true,
                            },
                        ],
                    },
                ],
            },
        ])

        const pass = new ApiFieldGeneratorPass()
        const [result] = pass.run([input])

        expect(result.typeId).toBe('GeneratedApiField')
        expect(result.code).toContain('export const ApiApiField = {')
        expect(result.code).toContain('EMAIL: "email",')

        const occurrences = (result.code.match(/EMAIL: "email",/g) || []).length
        expect(occurrences).toBe(1)
    })

    test('key derivation matches real project output (originalName.toUpperCase(), underscores stripped)', () => {
        const input = requestTypesArtifact([
            {
                resourceName: 'payment',
                formTypeName: 'PaymentForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'provider_user_id',
                                transformedName: 'providerUserId',
                                type: { kind: 'primitive', type: 'string' } as never,
                                required: true,
                                nullable: false,
                            },
                            {
                                originalName: 'shipping_kode_pos',
                                transformedName: 'shippingKodePos',
                                type: { kind: 'primitive', type: 'string' } as never,
                                required: false,
                                nullable: true,
                            },
                        ],
                    },
                ],
            },
        ])

        const pass = new ApiFieldGeneratorPass()
        const [result] = pass.run([input])

        expect(result.code).toContain('PROVIDERUSERID: "provider_user_id",')
        expect(result.code).toContain('SHIPPINGKODEPOS: "shipping_kode_pos",')
        expect(result.code).not.toContain('PROVIDER_USER_ID')
        expect(result.code).not.toContain('SHIPPING_KODE_POS')
    })

    test('empty requestTypes produces a valid empty GeneratedApiField artifact', () => {
        const input = requestTypesArtifact([])

        const pass = new ApiFieldGeneratorPass()
        const result = pass.run([input])

        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(1)
        expect(result[0].typeId).toBe('GeneratedApiField')
        expect(typeof result[0].code).toBe('string')
    })

    test('running the pass twice on the same input produces identical code (deterministic)', () => {
        const input = requestTypesArtifact([
            {
                resourceName: 'wishlist',
                formTypeName: 'WishlistForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'produk_item_id',
                                transformedName: 'produkItemId',
                                type: { kind: 'primitive', type: 'string' } as never,
                                required: true,
                                nullable: false,
                            },
                        ],
                    },
                ],
            },
        ])

        const pass = new ApiFieldGeneratorPass()
        const [a] = pass.run([input])
        const [b] = new ApiFieldGeneratorPass().run([input])

        expect(a.code).toBe(b.code)
    })

    test('reproduces the exact real project contract/api-field.ts, insertion-ordered by first appearance', () => {
        // Same field order as the real committed contract/api-field.ts
        // (pasted 2026-08-24/26) — first-appearance order, NOT alphabetical.
        const originalNamesInRealFileOrder = [
            'name', 'email', 'password', 'redirect_to', 'provider',
            'provider_user_id', 'avatar_url', 'token', 'rating', 'title',
            'comment', 'produk_item_id', 'qty', 'code', 'items',
            'shipping_nama', 'shipping_telepon', 'shipping_alamat',
            'shipping_kota', 'shipping_kode_pos', 'metode', 'detail',
            'provider_txn_id', 'idempotency_key', 'gateway_code',
            'gateway_message', 'nama', 'deskripsi', 'gambar',
            'category_id', 'harga', 'stok', 'jumlah_review', 'id',
            'created_at', 'updated_at', 'user_id', 'total_harga',
            'status', 'order_number', 'order_id', 'subtotal_minor',
            'shipping_minor', 'discount_minor', 'tax_minor',
            'total_minor', 'banana', 'potato', 'flying_dog',
            'financial_status', 'refunded_at', 'refund_reason',
            'fulfillment_status', 'processing_at', 'shipped_at',
            'completed_at', 'canceled_at', 'cancel_reason',
            'promo_code_id', 'promo_code', 'metadata', 'telepon',
            'alamat', 'kota', 'kode_pos', 'paid_at', 'payment_id',
            'currency_code', 'amount_minor', 'fee_minor',
            'net_amount_minor', 'refund_amount_minor', 'payload_hash',
            'payload_received_at', 'gateway_status', 'authorized_at',
            'captured_at', 'failed_at', 'reconciled_at',
            'reconciliation_batch_id', 'is_verified_purchase',
            'discount_type', 'discount_value', 'max_discount_minor',
            'min_order_minor', 'usage_limit', 'used_count', 'is_active',
            'starts_at', 'ends_at', 'role', 'success', 'message', 'data',
        ]

        const input = requestTypesArtifact([
            {
                resourceName: 'allFields',
                formTypeName: 'AllFieldsForm',
                actions: [
                    {
                        name: 'create',
                        fields: originalNamesInRealFileOrder.map(originalName => ({
                            originalName,
                            transformedName: originalName.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
                            type: { kind: 'primitive', type: 'string' } as never,
                            required: false,
                            nullable: true,
                        })),
                    },
                ],
            },
        ])

        const pass = new ApiFieldGeneratorPass()
        const [result] = pass.run([input])

        const expected =
            '// Auto-generated by routesync. Do not edit manually.\n\n' +
            'export const ApiApiField = {\n' +
            '  NAME: "name",\n' +
            '  EMAIL: "email",\n' +
            '  PASSWORD: "password",\n' +
            '  REDIRECTTO: "redirect_to",\n' +
            '  PROVIDER: "provider",\n' +
            '  PROVIDERUSERID: "provider_user_id",\n' +
            '  AVATARURL: "avatar_url",\n' +
            '  TOKEN: "token",\n' +
            '  RATING: "rating",\n' +
            '  TITLE: "title",\n' +
            '  COMMENT: "comment",\n' +
            '  PRODUKITEMID: "produk_item_id",\n' +
            '  QTY: "qty",\n' +
            '  CODE: "code",\n' +
            '  ITEMS: "items",\n' +
            '  SHIPPINGNAMA: "shipping_nama",\n' +
            '  SHIPPINGTELEPON: "shipping_telepon",\n' +
            '  SHIPPINGALAMAT: "shipping_alamat",\n' +
            '  SHIPPINGKOTA: "shipping_kota",\n' +
            '  SHIPPINGKODEPOS: "shipping_kode_pos",\n' +
            '  METODE: "metode",\n' +
            '  DETAIL: "detail",\n' +
            '  PROVIDERTXNID: "provider_txn_id",\n' +
            '  IDEMPOTENCYKEY: "idempotency_key",\n' +
            '  GATEWAYCODE: "gateway_code",\n' +
            '  GATEWAYMESSAGE: "gateway_message",\n' +
            '  NAMA: "nama",\n' +
            '  DESKRIPSI: "deskripsi",\n' +
            '  GAMBAR: "gambar",\n' +
            '  CATEGORYID: "category_id",\n' +
            '  HARGA: "harga",\n' +
            '  STOK: "stok",\n' +
            '  JUMLAHREVIEW: "jumlah_review",\n' +
            '  ID: "id",\n' +
            '  CREATEDAT: "created_at",\n' +
            '  UPDATEDAT: "updated_at",\n' +
            '  USERID: "user_id",\n' +
            '  TOTALHARGA: "total_harga",\n' +
            '  STATUS: "status",\n' +
            '  ORDERNUMBER: "order_number",\n' +
            '  ORDERID: "order_id",\n' +
            '  SUBTOTALMINOR: "subtotal_minor",\n' +
            '  SHIPPINGMINOR: "shipping_minor",\n' +
            '  DISCOUNTMINOR: "discount_minor",\n' +
            '  TAXMINOR: "tax_minor",\n' +
            '  TOTALMINOR: "total_minor",\n' +
            '  BANANA: "banana",\n' +
            '  POTATO: "potato",\n' +
            '  FLYINGDOG: "flying_dog",\n' +
            '  FINANCIALSTATUS: "financial_status",\n' +
            '  REFUNDEDAT: "refunded_at",\n' +
            '  REFUNDREASON: "refund_reason",\n' +
            '  FULFILLMENTSTATUS: "fulfillment_status",\n' +
            '  PROCESSINGAT: "processing_at",\n' +
            '  SHIPPEDAT: "shipped_at",\n' +
            '  COMPLETEDAT: "completed_at",\n' +
            '  CANCELEDAT: "canceled_at",\n' +
            '  CANCELREASON: "cancel_reason",\n' +
            '  PROMOCODEID: "promo_code_id",\n' +
            '  PROMOCODE: "promo_code",\n' +
            '  METADATA: "metadata",\n' +
            '  TELEPON: "telepon",\n' +
            '  ALAMAT: "alamat",\n' +
            '  KOTA: "kota",\n' +
            '  KODEPOS: "kode_pos",\n' +
            '  PAIDAT: "paid_at",\n' +
            '  PAYMENTID: "payment_id",\n' +
            '  CURRENCYCODE: "currency_code",\n' +
            '  AMOUNTMINOR: "amount_minor",\n' +
            '  FEEMINOR: "fee_minor",\n' +
            '  NETAMOUNTMINOR: "net_amount_minor",\n' +
            '  REFUNDAMOUNTMINOR: "refund_amount_minor",\n' +
            '  PAYLOADHASH: "payload_hash",\n' +
            '  PAYLOADRECEIVEDAT: "payload_received_at",\n' +
            '  GATEWAYSTATUS: "gateway_status",\n' +
            '  AUTHORIZEDAT: "authorized_at",\n' +
            '  CAPTUREDAT: "captured_at",\n' +
            '  FAILEDAT: "failed_at",\n' +
            '  RECONCILEDAT: "reconciled_at",\n' +
            '  RECONCILIATIONBATCHID: "reconciliation_batch_id",\n' +
            '  ISVERIFIEDPURCHASE: "is_verified_purchase",\n' +
            '  DISCOUNTTYPE: "discount_type",\n' +
            '  DISCOUNTVALUE: "discount_value",\n' +
            '  MAXDISCOUNTMINOR: "max_discount_minor",\n' +
            '  MINORDERMINOR: "min_order_minor",\n' +
            '  USAGELIMIT: "usage_limit",\n' +
            '  USEDCOUNT: "used_count",\n' +
            '  ISACTIVE: "is_active",\n' +
            '  STARTSAT: "starts_at",\n' +
            '  ENDSAT: "ends_at",\n' +
            '  ROLE: "role",\n' +
            '  SUCCESS: "success",\n' +
            '  MESSAGE: "message",\n' +
            '  DATA: "data",\n' +
            '} as const\n'

        expect(result.code).toBe(expected)
    })
})
