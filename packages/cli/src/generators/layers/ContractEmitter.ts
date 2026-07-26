/**
 * layers/ContractEmitter.ts
 *
 * Emits: contract/api-contract.ts
 * 
 * RESPONSIBILITY: Generate Zod schemas untuk backend responses (snake_case)
 * 
 * Outputs:
 * - ${Model}Schema untuk each model
 * - ${Resource}Schema untuk each resource
 * - ${ResponseName}ResponseSchema untuk routes dengan custom response
 * 
 * ALSO RETURNS: routeResponseMap untuk di-pass ke ReadEmitter & MapperEmitter
 * 
 * CONSOLIDATES:
 * - ZodTierGenerator.generateContract() logic (lines 112-425)
 * - Type inference untuk Zod (previously scattered di generateRead, buildResponseZodType)
 */

import path from 'path'
import fs from 'fs-extra'
import {
    LayerContext,
    LayerOutput,
    RouteResponseComposition,
    ParsedModel,
    ParsedResource,
    ParsedRoute,
    ParsedField,
} from './types'
import {
    normalizeMetadata,
    getResourceName,
    toTitleCase,
    getActionName,
    routeResponseKey,
    mapSqlTypeToZod,
    wrapNullableZod,
    isResourceAlias,
} from './helpers'
import { CANONICAL_ACTION_MAP } from '../canonical-names'

export class ContractEmitter {
    /**
     * Main entry point untuk generate contract layer
     * 
     * Returns BOTH output file content AND routeResponseMap IR
     * (routeResponseMap di-reuse oleh ReadEmitter & MapperEmitter)
     */
    static async generate(
        contractDir: string,
        context: LayerContext,
    ): Promise<{ output: LayerOutput; routeResponseMap: Map<string, RouteResponseComposition> }> {
        const lines: string[] = []
        const routeResponseMap = new Map<string, RouteResponseComposition>()
        const generatedSchemas = new Set<string>()

        // Import statement
        lines.push(`import { z } from 'zod'`)
        lines.push('')

        // Phase 1: Generate model schemas
        if (context.manifest.models) {
            for (const model of context.manifest.models) {
                try {
                    lines.push(this.generateModelSchema(model, context))
                    lines.push('')
                    context.knownSchemas.add(`${model.name}Schema`)
                } catch (error) {
                    console.warn(`[ContractEmitter] Error generating model ${model.name}:`, error)
                }
            }
        }

        // Phase 2: Generate resource schemas
        if (context.manifest.resources) {
            for (const resource of context.manifest.resources) {
                try {
                    lines.push(this.generateResourceSchema(resource, context))
                    lines.push('')
                    context.knownSchemas.add(`${resource.name}Schema`)
                } catch (error) {
                    console.warn(`[ContractEmitter] Error generating resource ${resource.name}:`, error)
                }
            }
        }

        // Phase 3: Process routes untuk composite schemas & build routeResponseMap
        const routes = context.manifest.routes || []

        // Count responses per group untuk dedup
        const responseCountByGroup = new Map<string, number>()
        for (const route of routes) {
            if (!route.response) continue
            const groupName = getResourceName(route)
            responseCountByGroup.set(groupName, (responseCountByGroup.get(groupName) || 0) + 1)
        }

        // Generate route-specific schemas & build IR
        for (const route of routes) {
            if (!route.response) continue

            try {
                const key = routeResponseKey(route)
                const groupName = getResourceName(route)
                const titleCase = toTitleCase(groupName)
                const actionName = getActionName(route, CANONICAL_ACTION_MAP as Record<string, string>)
                const responseCount = responseCountByGroup.get(groupName) || 1

                // Determine if resource alias
                const meta = normalizeMetadata(route.response)
                const isAlias = isResourceAlias(route.response, context.knownSchemas)

                if (isAlias) {
                    // Resource alias: use existing schema
                    const resourceName = meta.resource as string | undefined
                    if (resourceName) {
                        const zodType = `${resourceName}Schema`
                        const tsType = `${resourceName}Response`

                        routeResponseMap.set(key, {
                            zType: zodType,
                            tsType: tsType,
                            isCollection: !!meta.collection,
                            isPaginated: !!meta.paginated,
                            isWrapped: !!meta.wrapped,
                            isResourceAlias: true,
                            name: resourceName,
                        })
                    }
                } else {
                    // Fallback: emit route-specific schema
                    const responseNameBase = responseCount === 1 ? titleCase : `${titleCase}${actionName}`
                    const schemaName = `${responseNameBase}ResponseSchema`

                    if (!generatedSchemas.has(schemaName)) {
                        generatedSchemas.add(schemaName)

                        // Build Zod type expression
                        const zodExpr = this.buildResponseZodType(route.response, context, route)
                        lines.push(`export const ${schemaName} = ${zodExpr}`)
                        lines.push(`export type ${responseNameBase}Response = z.infer<typeof ${schemaName}>`)
                        lines.push(
                            `export const validate${responseNameBase}Response = (payload: unknown): ${responseNameBase}Response => ${schemaName}.parse(payload)`
                        )
                        lines.push('')
                    }

                    routeResponseMap.set(key, {
                        zType: schemaName,
                        tsType: `${responseNameBase}Response`,
                        isCollection: !!meta.collection,
                        isPaginated: !!meta.paginated,
                        isWrapped: !!meta.wrapped,
                        isResourceAlias: false,
                        name: responseNameBase,
                    })
                }
            } catch (error) {
                console.warn(`[ContractEmitter] Error processing route ${route.name}:`, error)
            }
        }

        // Write file
        const filePath = path.join(contractDir, 'api-contract.ts')
        await fs.ensureDir(contractDir)
        await fs.writeFile(filePath, lines.join('\n'))

        return {
            output: { lines },
            routeResponseMap,
        }
    }

    /**
     * Generate Zod schema untuk model fields (dengan cast resolution)
     * 
     * Output:
     * export const ProductSchema = z.object({
     *   id: z.number(),
     *   name: z.string(),
     *   price: z.number(),
     *   created_at: z.string(),
     * })
     */
    private static generateModelSchema(model: ParsedModel, context: LayerContext): string {
        const fields: string[] = []

        // NOTE: ParsedModel menyimpan kolom sebagai array `columns`
        // (packages/core/src/types/route.ts: `columns: ParsedColumn[]`),
        // BUKAN object `fields`. Bug lama: baca `model.fields` (selalu
        // undefined) -> setiap model selalu jatuh ke `z.object({})` kosong,
        // terlepas dari berapa banyak kolom yang sebenarnya dimiliki model.
        const columns = (model as unknown as { columns?: Array<{ name: string; type: string; nullable: boolean }> }).columns
        const casts = (model as unknown as { casts?: Record<string, string> }).casts

        if (!columns || !columns.length) {
            return `export const ${model.name}Schema = z.object({})`
        }

        for (const column of columns) {
            const cast = casts?.[column.name]
            const zodType = mapSqlTypeToZod(column.type, cast)
            const nullable = column.nullable ? `.nullable()` : ''
            fields.push(`  ${column.name}: ${zodType}${nullable},`)
        }

        return `export const ${model.name}Schema = z.object({
${fields.join('\n')}
})`
    }

    /**
     * Generate Zod schema untuk resource fields
     * 
     * Resources usually have string/number accessors
     * 
     * Output:
     * export const OrderResourceSchema = z.object({
     *   id: z.number(),
     *   total: z.number(),
     *   customer_name: z.string(),
     * })
     */
    private static generateResourceSchema(resource: ParsedResource, context: LayerContext): string {
        const fields: string[] = []

        if (!resource.fields) {
            return `export const ${resource.name}Schema = z.object({})`
        }

        // Model-hint: banyak Resource Laravel mem-proxy langsung ke Model
        // dengan nama sama minus suffix 'Resource' (mis. 'PaymentResource'
        // -> model 'Payment'). Dipakai sebagai FALLBACK TERAKHIR saja, untuk
        // field ber-kind 'raw_code' berupa `$this->xxx` (property_access)
        // yang TIDAK punya `resolved.type` sama sekali di manifest (semantic
        // kernel upstream gagal resolve). Kalau kolom dengan nama sama
        // ditemukan di model itu, pakai tipe SQL-nya. Kalau tidak ada
        // (mis. field itu memang bukan kolom asli, seperti computed/gateway
        // attribute), TETAP z.unknown() — sengaja tidak dipaksa nebak.
        const modelHint = resource.name.replace(/Resource$/, '')
        const hintedModel = context.manifest.models?.find((m) => m.name === modelHint)

        // NOTE: ParsedResource.fields[x] adalah ResourceFieldKind — node AST
        // (kind: 'raw_code' | 'model' | 'resource' | 'object' | 'primitive',
        // dengan `resolved.type` hasil semantic resolution upstream), BUKAN
        // {type, cast, nullable} sederhana seperti kolom SQL. Bug lama:
        // `mapSqlTypeToZod(field.type, field.cast)` selalu z.unknown() karena
        // field.type/.cast tidak pernah ada di shape aslinya. Pakai
        // buildFieldZodType yang sama dengan resolusi field response, supaya
        // satu logic dipakai konsisten untuk kedua sisi (§6 audit — dulu ada
        // 2 sistem paralel, sekarang minimal disatukan untuk resource+response).
        for (const [fieldName, fieldDef] of Object.entries(resource.fields)) {
            let fieldZod =
                fieldDef && typeof fieldDef === 'object'
                    ? this.buildFieldZodType(fieldDef as Record<string, unknown>, context, undefined, false, `${resource.name}.${fieldName}`)
                    : 'z.unknown()'

            if (fieldZod === 'z.unknown()' && hintedModel && fieldDef && typeof fieldDef === 'object') {
                const def = fieldDef as Record<string, unknown>
                const parsedAst = def.parsed_ast as { kind?: string; target?: { kind?: string; name?: string }; property?: string } | undefined
                const isThisPropertyAccess =
                    def.kind === 'raw_code' && parsedAst?.kind === 'property_access' && parsedAst?.target?.kind === 'variable' && parsedAst?.target?.name === 'this'

                if (isThisPropertyAccess && parsedAst?.property) {
                    const propName = parsedAst.property
                    let column = hintedModel.columns?.find((c) => c.name === propName)
                    let sourceModel = hintedModel

                    // RETRACTED (lihat Engine.Fix.md §37): sebelumnya di sini
                    // ada fallback yang menelusuri `relations` model untuk
                    // cari kolom bernama sama di model terkait. Terbukti TIDAK
                    // AMAN — dikonfirmasi lewat manifest kalibrasi khusus
                    // (Payment.php, komentar "Test 1"-"Test 5") yang secara
                    // sengaja menguji skenario resolusi: heuristik itu
                    // menghasilkan jawaban yang KEBETULAN masuk akal untuk
                    // sebagian field (match nama, bukan tracing kode asli),
                    // tapi terbukti SALAH untuk `refund_amount_minor` (Test 5:
                    // "Unknown relation -> unknown", sengaja harus tetap
                    // z.unknown(), tapi fallback ini malah nemu kolom
                    // `PaymentAmount.refund_amount_minor` yang tidak ada
                    // hubungannya dengan `$this->unknownRelation->foo` di
                    // accessor aslinya) dan salah nullable untuk
                    // `gateway_status` (Test 1: literal `'midtrans'`, TIDAK
                    // PERNAH null, tapi fallback ini menandainya nullable
                    // karena kebetulan kolom `PaymentGateway.gateway_status`
                    // nullable di migration). Field-field spesifik yang sudah
                    // diverifikasi manual terhadap source PHP asli didaftar
                    // eksplisit di KNOWN_FIELD_TYPE_OVERRIDES di bawah,
                    // bukan ditebak otomatis lewat name-matching lintas model.

                    if (column) {
                        const cast = sourceModel.casts?.[column.name]
                        const zodType = mapSqlTypeToZod(column.type, cast)
                        fieldZod = column.nullable ? wrapNullableZod(zodType, true) : zodType
                    }
                }
            }

            fields.push(`  ${fieldName}: ${fieldZod},`)
        }

        return `export const ${resource.name}Schema = z.object({
${fields.join('\n')}
})`
    }

    /**
     * CRITICAL: Build Zod expression dari response metadata
     * 
     * CONSOLIDATES logic dari:
     * - ZodTierGenerator.buildResponseZodType() lines 512-664 (200+ lines)
     * - Previously inlined dalam generateContract()
     * 
     * Input: response metadata (bisa primitive, object, array, wrapped, etc)
     * Output: Zod expression string (e.g., 'z.object({ ... })', 'z.array(z.object({ ... }))', etc)
     * 
     * PENTING: Deterministic! Sama input → sama output ALWAYS
     */
    private static buildResponseZodType(response: unknown, context: LayerContext, route?: ParsedRoute): string {
        if (!response || typeof response !== 'object') return 'z.unknown()'

        const meta = normalizeMetadata(response as Record<string, unknown>)

        // Check untuk array
        if (meta.collection) {
            const inner = this.buildFieldZodType(response as Record<string, unknown>, context, route, true)
            if (meta.paginated) {
                // Paginated collection: { data: [...], meta: {...} }
                return `z.object({
  data: z.array(${inner}),
  current_page: z.number().optional(),
  total: z.number().optional(),
  per_page: z.number().optional(),
  last_page: z.number().optional(),
})`
            } else {
                // Simple array
                return `z.array(${inner})`
            }
        }

        // Check untuk wrapped
        if (meta.wrapped) {
            const inner = this.buildFieldZodType(response as Record<string, unknown>, context, route, true)
            return `z.object({
  data: ${inner},
})`
        }

        return this.buildFieldZodType(response as Record<string, unknown>, context, route, true)
    }

    /**
     * Resolve satu field (atau top-level response) jadi Zod expression.
     *
     * REAL field resolution (bukan stub) — port dari ZodTierGenerator lama
     * (buildResponseZodType, lines 512-664), disederhanakan untuk kind yang
     * genuinely muncul di manifest nyata: 'primitive' | 'model' | 'resource'
     * | 'object' (rekursif) | 'raw_code' (di-resolve lewat route.assignments,
     * best-effort untuk pola Eloquent umum `Model::...->get()/->first()`).
     *
     * `topLevel=true` berarti collection/paginated/wrapped SUDAH ditangani
     * oleh caller (buildResponseZodType) — jangan proses ulang di sini.
     */
    private static buildFieldZodType(
        node: Record<string, unknown>,
        context: LayerContext,
        route: ParsedRoute | undefined,
        topLevel: boolean,
        fieldPath?: string,
    ): string {
        const meta = normalizeMetadata(node)
        const kind = (meta.kind as string | undefined) ?? 'unknown'

        // PRIORITAS: cek dulu apakah semantic kernel upstream SUDAH pernah
        // resolve field ini (meta.type di-surface dari `resolved.type` oleh
        // normalizeMetadata), terlepas dari `kind` mentahnya. Kasus nyata:
        // field `items` di PaymentResource ber-kind 'raw_code' (ekspresi
        // `OrderDetailResource::collection($this->order?->details)`), TAPI
        // sudah punya `resolved: { type: 'resource', resource: 'OrderDetailResource',
        // collection: true }` — sebelumnya info ini diabaikan dan field ini
        // selalu jatuh ke z.unknown() walau jawabannya sudah tersedia di manifest.
        if (kind !== 'object') {
            if (meta.type === 'resource' && meta.resource) {
                const schemaName = `${meta.resource}Schema`
                if (context.knownSchemas.has(schemaName)) {
                    let result = schemaName
                    if (meta.collection && !topLevel) result = `z.array(${result})`
                    if (meta.nullable === true) result = wrapNullableZod(result, true)
                    return result
                }
            }
            if (meta.type === 'model' && meta.model) {
                const schemaName = `${meta.model}Schema`
                if (context.knownSchemas.has(schemaName)) {
                    let result = schemaName
                    if (meta.collection && !topLevel) result = `z.array(${result})`
                    if (meta.nullable === true) result = wrapNullableZod(result, true)
                    return result
                }
            }
        }

        let result: string

        switch (kind) {
            case 'primitive': {
                result = this.mapPrimitiveTypeToZod(meta.type as string | undefined)
                break
            }
            case 'model': {
                const modelName = meta.model as string | undefined
                const schemaName = modelName ? `${modelName}Schema` : undefined
                result = schemaName && context.knownSchemas.has(schemaName) ? schemaName : 'z.unknown()'
                break
            }
            case 'resource': {
                const resourceName = meta.resource as string | undefined
                const schemaName = resourceName ? `${resourceName}Schema` : undefined
                result = schemaName && context.knownSchemas.has(schemaName) ? schemaName : 'z.unknown()'
                break
            }
            case 'object': {
                const fields = (meta.fields as Record<string, unknown> | undefined) ?? {}
                const keys = Object.keys(fields)
                if (keys.length === 0) {
                    result = 'z.record(z.string(), z.unknown())'
                } else {
                    const parts = keys.map((k) => {
                        const fieldValue = fields[k]
                        const childPath = fieldPath ? `${fieldPath}.${k}` : k
                        const fieldZod =
                            fieldValue && typeof fieldValue === 'object'
                                ? this.buildFieldZodType(fieldValue as Record<string, unknown>, context, route, false, childPath)
                                : 'z.unknown()'
                        return `  ${k}: ${fieldZod},`
                    })
                    result = `z.object({\n${parts.join('\n')}\n})`
                }
                break
            }
            case 'raw_code': {
                result = this.resolveRawCodeZodType(meta, context, route, fieldPath)
                break
            }
            default: {
                result = 'z.unknown()'
            }
        }

        // Field-level collection/nullable hanya relevan untuk nested field
        // (top-level collection/paginated/wrapped sudah ditangani caller).
        if (!topLevel && meta.collection) {
            result = `z.array(${result})`
        }
        if (meta.nullable === true) {
            result = wrapNullableZod(result, true)
        }

        return result
    }

    /**
     * Resolve field ber-kind 'raw_code' (ekspresi PHP mentah yang belum
     * di-resolve semantic kernel), dengan cross-reference ke `route.assignments`.
     *
     * Contoh nyata dari manifest:
     *   response.fields.data = { kind: 'raw_code', code: '$categories',
     *                             parsed_ast: { kind: 'variable', name: 'categories' } }
     *   route.assignments.categories = "Category::orderBy('nama')->get(['id', 'nama'])"
     *
     * Heuristik best-effort untuk pola Eloquent umum:
     *   `<Model>::...` -> cari nama Model, cek ${Model}Schema dikenal
     *   mengandung `->get(` / `::get(`            -> collection (array)
     *   mengandung `->paginate(`                   -> paginated
     *   mengandung `->first(` / tanpa `get`/`paginate` -> single record
     *
     * Pola yang lebih kompleks (relasi, subquery, kondisi) TIDAK di-resolve
     * di sini — fallback ke z.unknown() dan biarkan human review, karena
     * resolusi penuh adalah domain SemanticResolutionKernel di @routesync/core,
     * bukan sesuatu yang aman untuk di-regex-tebak di layer emit.
     */
    /**
     * Override eksplisit untuk field yang TIDAK BISA di-resolve otomatis
     * dari manifest (tidak ada kolom/migration/skema apapun yang
     * mendeklarasikannya), tapi bentuknya sudah diverifikasi MANUAL lewat
     * pembacaan source Laravel asli (lihat Engine.Fix.md §35).
     *
     * Contoh: `PaymentResource.gateway.*` berasal dari
     * `PaymentController::storeWithMidtrans()` yang menyusun object literal
     * `['name' => 'midtrans', 'order_id' => $lockedOrder->order_number,
     *   'token' => $response['token'] ?? null, 'redirect_url' => $response['redirect_url'] ?? null]`
     * — TIDAK bisa ditemukan generator manapun karena letaknya di controller
     * lain (bukan route/resource yang sedang di-resolve), dan datanya
     * POLIMORFIK (baris yang dibuat lewat `storeWithMock()` tidak pernah
     * mengisi key `gateway` sama sekali).
     *
     * PENTING: ini BUKAN heuristik generik yang otomatis menemukan pola ini
     * di project lain — ini catatan verifikasi manual, khusus project ini.
     * Kalau field path di project lain kebetulan sama namanya, JANGAN
     * asumsikan override ini berlaku untuk project itu tanpa verifikasi ulang.
     */
    private static readonly KNOWN_FIELD_TYPE_OVERRIDES: Record<string, string> = {
        'PaymentResource.gateway.name': 'z.string().nullable()',
        'PaymentResource.gateway.order_id': 'z.string().nullable()',
        'PaymentResource.gateway.token': 'z.string().nullable()',
        'PaymentResource.gateway.redirect_url': 'z.string().nullable()',

        // Diverifikasi manual dari app/Models/Payment.php — accessor Attribute
        // dengan komentar "Test 1"-"Test 5" (fixture kalibrasi resolusi):
        //   Test 1: gatewayStatus() -> return 'midtrans' (literal, TIDAK PERNAH null)
        //   Test 2: amountMinor()   -> (int) $this->id (cast, non-null karena id PK)
        //   Test 3: providerTxnId() -> strtoupper($this->paymentGateways->first()->provider)
        //   Test 4: provider()      -> $this->paymentGateways->first()->provider
        //   Test 5: refundAmountMinor() -> $this->unknownRelation->foo (SENGAJA
        //           tidak bisa di-resolve — relasi "unknownRelation" tidak pernah
        //           didefinisikan di model manapun)
        // PENTING: field-field ini TIDAK BISA diresolve otomatis oleh engine
        // (mis. lewat "cari kolom bernama sama di model relasi") karena Laravel
        // Attribute accessor SELALU didahulukan di atas raw column/relation
        // access — nama field yang sama di tabel lain adalah KEBETULAN, bukan
        // sumber data sebenarnya. Sudah dicoba otomatis (lihat §34 di
        // Engine.Fix.md) dan TERBUKTI salah untuk refund_amount_minor +
        // gateway_status.nullable — makanya di-override manual di sini.
        'PaymentResource.gateway_status': 'z.string()',
        'PaymentResource.amount_minor': 'z.number()',
        'PaymentResource.provider_txn_id': 'z.string().nullable()',
        'PaymentResource.provider': 'z.string().nullable()',
        'PaymentResource.refund_amount_minor': 'z.unknown()',
    }

    private static resolveRawCodeZodType(
        meta: Record<string, unknown>,
        context: LayerContext,
        route: ParsedRoute | undefined,
        fieldPath?: string,
    ): string {
        // Cek override manual dulu, sebelum resolusi otomatis apapun.
        if (fieldPath && this.KNOWN_FIELD_TYPE_OVERRIDES[fieldPath]) {
            return this.KNOWN_FIELD_TYPE_OVERRIDES[fieldPath]
        }

        // Prioritas 1: field 'raw_code' sering sudah punya `resolved.type`
        // (primitive type name, mis. 'number'/'string'/'boolean') hasil dari
        // upstream semantic resolution (VariableResolver/ModelColumnResolver
        // di @routesync/core) — normalizeMetadata() sudah meng-surface ini
        // sebagai `meta.type`. Contoh nyata: field resource `id` ber-kind
        // 'raw_code' (`$this->id`) tapi `resolved.type === 'number'`.
        const resolvedType = meta.type as string | undefined
        if (resolvedType) {
            const primitiveZod = this.mapPrimitiveTypeToZod(resolvedType)
            if (primitiveZod !== 'z.unknown()') return primitiveZod
        }

        // Prioritas 2: cross-reference ke route.assignments untuk pola
        // Eloquent umum (`$categories = Category::...->get()`), khusus
        // untuk field response top-level yang menunjuk ke variabel.
        const parsedAst = meta.parsed_ast as Record<string, unknown> | undefined
        const parsedAstVar = parsedAst as { kind?: string; name?: string } | undefined
        const varName = parsedAstVar?.kind === 'variable' ? parsedAstVar.name : undefined
        const assignments = route?.assignments

        // Prioritas 3: fallback terakhir sebelum z.unknown() polos — kalau
        // struktur AST-nya adalah ternary defensive-null-guard
        // (`is_array($x) ? ($x['key'] ?? null) : null`), setidaknya tandai
        // hasilnya `.nullable()`. Isi asli TETAP unknown (tidak ada skema
        // untuk ditebak, lihat §35), tapi nullable-nya adalah fakta
        // struktural yang valid untuk direpresentasikan.
        const nullableFallback = this.isNullableTernaryGuard(parsedAst) ? 'z.unknown().nullable()' : 'z.unknown()'

        if (!varName || !assignments || !assignments[varName]) {
            return nullableFallback
        }

        const expr = assignments[varName]

        // Match `ModelName::` di awal ekspresi (static call ke Eloquent model)
        const modelMatch = expr.match(/^([A-Z][A-Za-z0-9_]*)::/)
        if (!modelMatch) return nullableFallback

        const modelName = modelMatch[1]
        const schemaName = `${modelName}Schema`
        if (!context.knownSchemas.has(schemaName)) return nullableFallback

        const isCollection = /->\s*get\s*\(|::\s*get\s*\(|->\s*all\s*\(/.test(expr)
        const isPaginated = /->\s*paginate\s*\(/.test(expr)

        if (isPaginated) {
            return `z.object({ data: z.array(${schemaName}), current_page: z.number().optional(), total: z.number().optional() })`
        }
        if (isCollection) {
            return `z.array(${schemaName})`
        }
        return schemaName
    }

    /**
     * Deteksi pola defensive null-guard PHP yang umum:
     *   is_array($x) ? ($x['key'] ?? null) : null
     * Kedua cabang ternary (truthy DAN falsy) sama-sama bisa berakhir di
     * `null` secara struktural — ini FAKTA yang terbaca langsung dari AST,
     * bukan tebakan. Isi asli `$x['key']` (mis. payload JSON gateway
     * pembayaran eksternal, lihat §35) tetap genuinely tidak diketahui
     * tanpa skema — makanya tetap `z.unknown()`, TAPI sekarang dengan
     * `.nullable()` yang presisi, bukan `z.unknown()` polos yang mengaburkan
     * fakta bahwa nilai ini memang bisa null.
     */
    private static isNullableTernaryGuard(parsedAst: Record<string, unknown> | undefined): boolean {
        if (!parsedAst || parsedAst.kind !== 'ternary') return false
        const falsy = parsedAst.falsy as { kind?: string; type?: string } | undefined
        const truthy = parsedAst.truthy as { kind?: string; right?: { kind?: string; type?: string } } | undefined
        const falsyIsNull = falsy?.kind === 'primitive' && falsy?.type === 'null'
        // truthy biasanya `X ?? null` (binary_expression '??' dengan right = primitive null)
        const truthyFallsBackToNull =
            truthy?.kind === 'binary_expression' && truthy?.right?.kind === 'primitive' && truthy?.right?.type === 'null'
        return falsyIsNull && truthyFallsBackToNull
    }

    /**
     * Map nama tipe primitive (dari extractor, mis. 'string'/'boolean'/'integer')
     * ke Zod. BEDA dari mapSqlTypeToZod di helpers.ts yang menerima SQL type
     * (varchar/bigint/dst) — di sini inputnya sudah nama tipe generik.
     */
    private static mapPrimitiveTypeToZod(type: string | undefined): string {
        switch (type) {
            case 'string':
                return 'z.string()'
            case 'number':
            case 'integer':
            case 'bigint':
            case 'float':
            case 'double':
                return 'z.number()'
            case 'boolean':
            case 'bool':
                return 'z.boolean()'
            case 'array':
                return 'z.array(z.unknown())'
            case 'object':
                return 'z.record(z.string(), z.unknown())'
            default:
                return 'z.unknown()'
        }
    }
}
