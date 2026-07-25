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
                    ? this.buildFieldZodType(fieldDef as Record<string, unknown>, context, undefined, false)
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

                    // Kalau kolom tidak ada langsung di model utama (mis.
                    // `Payment` tidak punya kolom `amount_minor`/`provider`),
                    // coba telusuri lewat `relations` model itu — kolom bisa
                    // ada di tabel terpisah yang diakses lewat relasi
                    // (mis. Payment hasMany PaymentAmount/PaymentGateway,
                    // lihat migration `create_payment_amounts_table.php` /
                    // `create_payment_gateways_table.php`). Cardinality
                    // relasi (hasOne/hasMany/belongsTo) tidak relevan di sini
                    // — yang dicari cuma TIPE kolomnya, bukan collection-ness.
                    if (!column && hintedModel.relations) {
                        for (const rel of Object.values(hintedModel.relations)) {
                            const relInfo = rel as { model?: string } | undefined
                            if (!relInfo?.model) continue
                            const relatedModel = context.manifest.models?.find((m) => m.name === relInfo.model)
                            const relatedColumn = relatedModel?.columns?.find((c) => c.name === propName)
                            if (relatedColumn) {
                                column = relatedColumn
                                sourceModel = relatedModel!
                                break
                            }
                        }
                    }

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
                        const fieldZod =
                            fieldValue && typeof fieldValue === 'object'
                                ? this.buildFieldZodType(fieldValue as Record<string, unknown>, context, route, false)
                                : 'z.unknown()'
                        return `  ${k}: ${fieldZod},`
                    })
                    result = `z.object({\n${parts.join('\n')}\n})`
                }
                break
            }
            case 'raw_code': {
                result = this.resolveRawCodeZodType(meta, context, route)
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
    private static resolveRawCodeZodType(
        meta: Record<string, unknown>,
        context: LayerContext,
        route: ParsedRoute | undefined,
    ): string {
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
        const parsedAst = meta.parsed_ast as { kind?: string; name?: string } | undefined
        const varName = parsedAst?.kind === 'variable' ? parsedAst.name : undefined
        const assignments = route?.assignments

        if (!varName || !assignments || !assignments[varName]) {
            return 'z.unknown()'
        }

        const expr = assignments[varName]

        // Match `ModelName::` di awal ekspresi (static call ke Eloquent model)
        const modelMatch = expr.match(/^([A-Z][A-Za-z0-9_]*)::/)
        if (!modelMatch) return 'z.unknown()'

        const modelName = modelMatch[1]
        const schemaName = `${modelName}Schema`
        if (!context.knownSchemas.has(schemaName)) return 'z.unknown()'

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