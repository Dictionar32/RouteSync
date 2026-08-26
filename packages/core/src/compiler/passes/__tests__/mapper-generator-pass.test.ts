/**
 * TDD contract test for MapperGeneratorPass (does not exist yet).
 *
 * Purpose: define the target contract for a NEW pass under
 * packages/core/src/compiler/passes/ — NOT MapperEmitter.ts / ContractIR /
 * generate-v2. This test is written FIRST, expected to fail (module not
 * found / class not implemented), then MapperGeneratorPass.ts is
 * implemented to make it pass.
 *
 * Design audit trail (2026-08-24, see docs/investigations/...):
 *   - Input: RequestTypesArtifact ONLY (single input, matches existing
 *     single-input-pass precedent: ContractGeneratorPass, FormGeneratorPass).
 *     GeneratedContractArtifact was considered but rejected — it carries no
 *     per-field data (only raw `.code` string + metadata), so it cannot
 *     help derive read-mapper field mappings. Every type name referenced
 *     below is derived using the SAME canonical naming utilities
 *     (toPascalCase/toCamelCase) that ContractGeneratorPass and
 *     TypeScriptGeneratorPass already use internally — not invented.
 *   - `${Resource}ApiResponse` — confirmed exact match against
 *     ContractCodeBuilder.ts:293 (`${pascalResource}ApiResponse`).
 *   - `${Resource}Transformed` — confirmed exact match against
 *     TypeScriptGeneratorPass.ts:165/274 (`${baseName}Transformed`).
 *   - `to${Resource}Read` / `to${Resource}ReadList` / `toApi${Request}${Action}`
 *     function-naming convention — reused from the OLD MapperEmitter.ts
 *     (packages/cli/src/generators/layers/MapperEmitter.ts), which itself
 *     cites a documented project convention ("Engine.Fix.md §18/§21"). Only
 *     the NAMING PATTERN is reused — none of that file's code/ContractIR
 *     dependency is reused.
 *   - Two separate output files, matching real project path conventions
 *     (confirmed 2026-08-24; `contract/api-field.ts` path literally matches
 *     the old FieldEmitter.ts's own `path: 'contract/api-field.ts'` — only
 *     the PATH STRING is reused as a naming convention, no code/dependency
 *     from that file is reused):
 *       - `contract/api-field.ts`  <- GeneratedMapperArtifact.fieldTableCode
 *         (the `ApiApiField` constant table)
 *       - `mappers/api-mapper.ts`  <- GeneratedMapperArtifact.code
 *         (toXRead / toXReadList / toApiXCreate / toApiXUpdate functions)
 *     The mapper functions in `.code` reference `ApiApiField.<KEY>` as a
 *     bare identifier (assumed imported from `contract/api-field.ts` at
 *     actual file-write time by the CLI layer) — this pass only produces
 *     the two code strings, it does not decide import statements/file
 *     writing (consistent with how ContractGeneratorPass/FormGeneratorPass
 *     only produce `.code` and leave file writing to CompilerBridge/
 *     commands/generate.ts).
 *   - `ApiApiField` key derivation: `originalName.toUpperCase().replace(/_/g, '')`
 *     — verified empirically against real project output (e.g.
 *     'redirect_to' -> 'REDIRECTTO'). This is DELIBERATELY NOT the same
 *     algorithm as the old `FieldEmitter.camelCaseToSnakeUpper()`
 *     (packages/cli/src/generators/layers/FieldEmitter.ts), which was
 *     verified empirically to be buggy — it produces 'REDIRECT_TO' (with
 *     an underscore), matching neither its own docstring examples nor the
 *     real generated file. `MapperGeneratorPass` generates its own
 *     `ApiApiField` table (deduplicated across all resources/actions) —
 *     it does not import/reuse FieldEmitter's output, since that belongs
 *     to the untouched IR/generate-v2 pipeline.
 *   - Form-mapper payload return type is intentionally left as an inferred
 *     inline object type (not an external `XPayload` type name) because
 *     FormGeneratorPass does not currently generate any such artifact —
 *     inventing that reference would repeat the earlier `.fields.data`
 *     mistake (referencing a shape that doesn't exist anywhere).
 *   - Action key access uses lowercase (`formTypeName['create']`), confirmed
 *     against FormActionGenerator.ts:63 (`${actionName.toLowerCase()}: {`).
 */

import { describe, expect, test } from 'vitest'
import { MapperGeneratorPass } from '../MapperGeneratorPass'
import type {
    RequestTypesArtifact,
    RequestType,
} from '../../artifacts/RequestTypesArtifact'
import {
    PrimitiveType,
    ObjectType,
} from '../../types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../utils/ImmutableCollections'

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

describe('MapperGeneratorPass', () => {
    describe('read mapper — from responseData', () => {
        test('generates toXRead + toXReadList referencing ApiResponse/Transformed types', () => {
            const input = requestTypesArtifact([
                {
                    resourceName: 'category',
                    formTypeName: 'CategoryForm',
                    actions: [],
                    responseData: {
                        resourceName: 'category',
                        fields: {
                            id: new PrimitiveType('number'),
                            nama: new PrimitiveType('string'),
                            created_at: new PrimitiveType('string'),
                        },
                    },
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            expect(result.typeId).toBe('GeneratedMapper')

            // Function signatures must reference the EXACT type names the
            // other passes actually produce today — not invented ones.
            expect(result.code).toContain(
                'export const toCategoryRead = (api: CategoryApiResponse): CategoryTransformed =>'
            )
            expect(result.code).toContain(
                'export const toCategoryReadList = (api: CategoryApiResponse[]): CategoryTransformed[] =>'
            )
            expect(result.code).toContain('api.map(toCategoryRead)')

            // Field mapping: snake_case source -> camelCase target.
            expect(result.code).toContain('id: api.id')
            expect(result.code).toContain('nama: api.nama')
            expect(result.code).toContain('createdAt: api.created_at')
        })

        test('nested object field keeps nested shape, not flattened or ReferenceType-degraded', () => {
            const userFields = new ImmutableMap<string, unknown>(new Map([
                ['id', new PrimitiveType('number')],
                ['name', new PrimitiveType('string')],
            ]))

            const input = requestTypesArtifact([
                {
                    resourceName: 'login_response',
                    formTypeName: 'LoginResponseForm',
                    actions: [],
                    responseData: {
                        resourceName: 'login_response',
                        fields: {
                            token: new PrimitiveType('string'),
                            user: new ObjectType(
                                userFields as never,
                                new ImmutableSet<string>(new Set([]))
                            ),
                        },
                    },
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            // The nested `user` object must be mapped as a nested object
            // literal (its own field-by-field mapping), not collapsed into
            // `user: api.user` (which would silently drop nested field
            // renaming, e.g. any snake_case inside `user`).
            expect(result.code).toContain('token: api.token')
            expect(result.code).toContain('user: {')
            expect(result.code).toContain('id: api.user.id')
            expect(result.code).toContain('name: api.user.name')
        })

        test('route without responseData produces no read mapper for that resource', () => {
            const input = requestTypesArtifact([
                {
                    resourceName: 'logout',
                    formTypeName: 'LogoutForm',
                    actions: [],
                    // no responseData
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            expect(result.code).not.toContain('toLogoutRead')
        })
    })

    describe('form mapper — from actions', () => {
        test('generates toApiXCreate using ApiApiField.<KEY> bracket notation (not literal snake_case key)', () => {
            const input = requestTypesArtifact([
                {
                    resourceName: 'register',
                    formTypeName: 'RegisterForm',
                    actions: [
                        {
                            name: 'create',
                            fields: [
                                {
                                    originalName: 'name',
                                    transformedName: 'name',
                                    type: new PrimitiveType('string'),
                                    required: true,
                                    nullable: false,
                                },
                                {
                                    originalName: 'redirect_to',
                                    transformedName: 'redirectTo',
                                    type: new PrimitiveType('string'),
                                    required: true,
                                    nullable: false,
                                },
                            ],
                        },
                    ],
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            expect(result.code).toContain(
                "export const toApiRegisterCreate = (form: RegisterForm['create'])"
            )

            // Bracket notation via ApiApiField, matching the real project's
            // ApiApiField naming exactly: originalName.toUpperCase() with
            // underscores stripped — e.g. 'redirect_to' -> 'REDIRECTTO'.
            // NOTE: this is NOT the same algorithm as the old
            // FieldEmitter.ts (camelCaseToSnakeUpper), which was verified
            // empirically to be buggy (produces 'REDIRECT_TO' with an
            // underscore, not matching either its own docstring or the
            // real generated output). MapperGeneratorPass derives the key
            // directly from RequestField.originalName instead.
            expect(result.code).toContain('[ApiApiField.NAME]: form.name')
            expect(result.code).toContain('[ApiApiField.REDIRECTTO]: form.redirectTo')
        })

        test('multiple actions on the same resource each get their own mapper function', () => {
            const input = requestTypesArtifact([
                {
                    resourceName: 'profile',
                    formTypeName: 'ProfileForm',
                    actions: [
                        {
                            name: 'create',
                            fields: [
                                {
                                    originalName: 'email',
                                    transformedName: 'email',
                                    type: new PrimitiveType('string'),
                                    required: true,
                                    nullable: false,
                                },
                            ],
                        },
                        {
                            name: 'update',
                            fields: [
                                {
                                    originalName: 'email',
                                    transformedName: 'email',
                                    type: new PrimitiveType('string'),
                                    required: false,
                                    nullable: true,
                                },
                            ],
                        },
                    ],
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            expect(result.code).toContain("toApiProfileCreate = (form: ProfileForm['create'])")
            expect(result.code).toContain("toApiProfileUpdate = (form: ProfileForm['update'])")
            expect(result.code).toContain('[ApiApiField.EMAIL]: form.email')
        })
    })

    describe('ApiApiField — global deduplicated field lookup table', () => {
        test('generates exactly one ApiApiField entry per unique originalName, shared across resources/actions', () => {
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
                                    type: new PrimitiveType('string'),
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
                            // different resource/action — must NOT produce
                            // a second ApiApiField.EMAIL entry.
                            fields: [
                                {
                                    originalName: 'email',
                                    transformedName: 'email',
                                    type: new PrimitiveType('string'),
                                    required: false,
                                    nullable: true,
                                },
                            ],
                        },
                    ],
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            // The ApiApiField table lives in contract/api-field.ts —
            // .fieldTableCode — NOT in .code (mappers/api-mapper.ts,
            // which only references it by identifier).
            expect(result.fieldTableCode).toContain('export const ApiApiField = {')
            expect(result.fieldTableCode).toContain('EMAIL: "email",')

            // Deduplication: exactly ONE occurrence of the EMAIL entry
            // definition line, even though `email` is used by two
            // different resources/actions above.
            const occurrences = (result.fieldTableCode.match(/EMAIL: "email",/g) || []).length
            expect(occurrences).toBe(1)
        })

        test('ApiApiField key derivation matches real project output exactly (originalName.toUpperCase(), underscores stripped)', () => {
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
                                    type: new PrimitiveType('string'),
                                    required: true,
                                    nullable: false,
                                },
                                {
                                    originalName: 'shipping_kode_pos',
                                    transformedName: 'shippingKodePos',
                                    type: new PrimitiveType('string'),
                                    required: false,
                                    nullable: true,
                                },
                            ],
                        },
                    ],
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            // Exact values confirmed against the real project's
            // ApiApiField output (pasted 2026-08-24) — NOT the buggy
            // FieldEmitter.camelCaseToSnakeUpper algorithm, which would
            // incorrectly produce 'PROVIDER_USER_ID' (with underscores).
            // Lives in .fieldTableCode (contract/api-field.ts), not .code.
            expect(result.fieldTableCode).toContain('PROVIDERUSERID: "provider_user_id",')
            expect(result.fieldTableCode).toContain('SHIPPINGKODEPOS: "shipping_kode_pos",')
            expect(result.fieldTableCode).not.toContain('PROVIDER_USER_ID')
            expect(result.fieldTableCode).not.toContain('SHIPPING_KODE_POS')
        })

        test('field table definition is NOT duplicated into the mapper functions file', () => {
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
                                    type: new PrimitiveType('string'),
                                    required: true,
                                    nullable: false,
                                },
                            ],
                        },
                    ],
                },
            ])

            const pass = new MapperGeneratorPass()
            const [result] = pass.run([input])

            // .code (mappers/api-mapper.ts) references ApiApiField.EMAIL
            // as a bare identifier, but must NOT contain the table
            // definition itself — that belongs solely in .fieldTableCode
            // (contract/api-field.ts). A mistaken merge of the two would
            // duplicate the const across both generated files.
            expect(result.code).toContain('ApiApiField.EMAIL')
            expect(result.code).not.toContain('export const ApiApiField = {')
            expect(result.fieldTableCode).toContain('export const ApiApiField = {')
            expect(result.fieldTableCode).not.toContain('export const toApiRegisterCreate')
        })
    })

    describe('empty / deterministic behavior', () => {
        test('empty requestTypes produces a valid empty GeneratedMapper artifact', () => {
            const input = requestTypesArtifact([])

            const pass = new MapperGeneratorPass()
            const result = pass.run([input])

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(result[0].typeId).toBe('GeneratedMapper')
            // Even with no resources, both output slots must exist as
            // valid (empty) strings — never undefined — so the CLI layer
            // can safely write both files unconditionally.
            expect(typeof result[0].code).toBe('string')
            expect(typeof result[0].fieldTableCode).toBe('string')
        })

        test('running the pass twice on the same input produces identical code (deterministic)', () => {
            const input = requestTypesArtifact([
                {
                    resourceName: 'wishlist',
                    formTypeName: 'WishlistForm',
                    actions: [],
                    responseData: {
                        resourceName: 'wishlist',
                        fields: {
                            id: new PrimitiveType('number'),
                            user_id: new PrimitiveType('number'),
                        },
                    },
                },
            ])

            const pass = new MapperGeneratorPass()
            const [a] = pass.run([input])
            const [b] = new MapperGeneratorPass().run([input])

            expect(a.code).toBe(b.code)
            expect(a.fieldTableCode).toBe(b.fieldTableCode)
        })
    })
})
