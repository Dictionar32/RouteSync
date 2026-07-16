import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { ZodTierGenerator } from '../../cli/src/generators/ZodTierGenerator'
import { SDKGenerator } from '../../cli/src/generators/SDKGenerator'
import { HookGenerator } from '../../cli/src/generators/HookGenerator'
import fs from 'fs-extra'
import path from 'path'

// ---------------------------------------------------------------------------
// Shared fixture factory
// ---------------------------------------------------------------------------

/**
 * A minimal RouteManifest with:
 *   - ONE route that has a request schema  → should emit PayloadSchema
 *   - ONE route that has a response        → should emit ResponseSchema
 *   - ONE model (Product)
 */
function makeManifest() {
  return {
    generatedAt: '2026-01-01T00:00:00.000Z',
    routes: [
      // POST /products → has schema.rules (payload) + response
      {
        name: 'products.store',
        method: 'POST',
        path: '/api/products',
        auth: true,
        middleware: ['api', 'auth:sanctum'],
        actionName: 'post',
        groupName: 'products',
        schema: {
          rules: {
            name: 'required|string|max:255',
            price: 'required|numeric',
            stock: 'nullable|integer',
          },
        },
        response: {
          kind: 'model',
          model: 'Product',
          collection: false,
          resolved: {
            status: 'resolved',
            type: 'model',
            model: 'Product',
            confidence: 100,
          },
        },
      },
      // GET /products → no schema.rules (no payload), only response (collection)
      {
        name: 'products.index',
        method: 'GET',
        path: '/api/products',
        auth: false,
        middleware: ['api'],
        actionName: 'list',
        groupName: 'products',
        schema: null,
        response: {
          kind: 'model',
          model: 'Product',
          collection: true,
          resolved: {
            status: 'resolved',
            type: 'model',
            model: 'Product',
            collection: true,
            confidence: 100,
          },
        },
      },
    ],
    models: [
      {
        name: 'Product',
        table: 'products',
        columns: [
          { name: 'id',    type: 'bigint',  nullable: false },
          { name: 'name',  type: 'varchar', nullable: false },
          { name: 'price', type: 'decimal', nullable: false },
          { name: 'stock', type: 'integer', nullable: true  },
        ],
        casts: {},
        relations: {},
        accessors: {},
      },
    ],
    resources: [],
    frontend: {
      groupAliases: {},
    },
  } as any
}

// ---------------------------------------------------------------------------
// Test dirs
// ---------------------------------------------------------------------------

const outDir = path.resolve(process.cwd(), 'temp-payload-split-test')

beforeAll(async () => {
  await fs.ensureDir(outDir)
  await ZodTierGenerator.generate(makeManifest(), outDir)
  await SDKGenerator.generate(makeManifest(), outDir, { zod: true })
  await HookGenerator.generate(makeManifest(), outDir)
})

afterAll(() => fs.remove(outDir))

// ===========================================================================
// 1. ZodTierGenerator — api-schema.ts must contain payload artefacts ONLY
// ===========================================================================

describe('ZodTierGenerator: api-schema.ts (request payloads)', () => {
  let schemaContent: string

  beforeAll(async () => {
    schemaContent = await fs.readFile(
      path.join(outDir, 'contract/api-schema.ts'),
      'utf8',
    )
  })

  it('exports *PayloadSchema for routes with schema.rules', () => {
    // Generator prefixes with 'Api' → ApiProductsCreatePayloadSchema
    expect(schemaContent).toMatch(/export const \w+PayloadSchema/)
  })

  it('exports *Payload type (z.infer) for each payload schema', () => {
    expect(schemaContent).toMatch(/export type \w+Payload /)
  })

  it('exports validate*Payload validator for each payload schema', () => {
    expect(schemaContent).toMatch(/export const validate\w+Payload/)
  })

  it('validate*Payload calls .parse() on the matching PayloadSchema', () => {
    expect(schemaContent).toMatch(/\w+PayloadSchema\.parse\(payload\)/)
  })

  it('does NOT contain any *ResponseSchema', () => {
    expect(schemaContent).not.toMatch(/export const \w+ResponseSchema/)
  })

  it('does NOT export validate*Response validators', () => {
    expect(schemaContent).not.toMatch(/export const validate\w+Response/)
  })

  it('generated PayloadSchema validates correct rule types (string + number)', () => {
    expect(schemaContent).toContain('z.string()')
    expect(schemaContent).toContain('z.number()')
  })
})

// ===========================================================================
// 2. ZodTierGenerator — api-contract.ts must contain response artefacts ONLY
// ===========================================================================

describe('ZodTierGenerator: api-contract.ts (backend responses)', () => {
  let contractContent: string

  beforeAll(async () => {
    contractContent = await fs.readFile(
      path.join(outDir, 'contract/api-contract.ts'),
      'utf8',
    )
  })

  it('exports model schema (ProductSchema)', () => {
    expect(contractContent).toContain('export const ProductSchema')
  })

  it('exports *ResponseSchema for routes that have a response', () => {
    expect(contractContent).toMatch(/export const \w+ResponseSchema/)
  })

  it('exports validate*Response validator for response schemas', () => {
    expect(contractContent).toMatch(/export const validate\w+Response/)
  })

  it('does NOT contain any *PayloadSchema', () => {
    expect(contractContent).not.toMatch(/export const \w+PayloadSchema/)
  })

  it('does NOT export validate*Payload validators', () => {
    expect(contractContent).not.toMatch(/export const validate\w+Payload/)
  })

  it('does NOT export *Payload types', () => {
    expect(contractContent).not.toMatch(/export type \w+Payload =/)
  })
})

// ===========================================================================
// 3. SDKGenerator — api.ts imports payload validators from api-schema
// ===========================================================================

describe('SDKGenerator: api.ts imports payload validators from api-schema', () => {
  let apiContent: string

  beforeAll(async () => {
    apiContent = await fs.readFile(path.join(outDir, 'api.ts'), 'utf8')
  })

  it('imports validate*Payload from ./contract/api-schema', () => {
    // e.g. import { validateApiProductsCreatePayload } from './contract/api-schema'
    expect(apiContent).toMatch(/from ['"]\.\/contract\/api-schema['"]/)
    // There must be at least one validate*Payload symbol imported from api-schema
    const schemaImportLine = apiContent
      .split('\n')
      .find(l => l.includes('./contract/api-schema'))
    expect(schemaImportLine).toMatch(/validate\w+Payload/)
  })

  it('does NOT import validate*Payload from ./contract/api-contract', () => {
    const contractImportLine = apiContent
      .split('\n')
      .find(l => l.includes('./contract/api-contract'))
    if (contractImportLine) {
      expect(contractImportLine).not.toContain('Payload')
    }
  })

  it('imports response validators from ./contract/api-contract', () => {
    const contractImportLine = apiContent
      .split('\n')
      .find(l => l.includes('./contract/api-contract'))
    expect(contractImportLine).toBeDefined()
  })

  it('payload validator is wired to the body contract of the mutation endpoint', () => {
    // body: validateApiProductsCreatePayload
    expect(apiContent).toMatch(/body:\s*validate\w+Payload/)
  })

  it('response validator is wired to the response contract of the endpoint', () => {
    expect(apiContent).toMatch(/response:\s*validate\w+/)
  })
})

// ===========================================================================
// 4. HookGenerator — hooks.ts must NOT import *Payload types from api-contract
// ===========================================================================

describe('HookGenerator: hooks.ts does not import payload types from api-contract', () => {
  let hooksContent: string

  beforeAll(async () => {
    hooksContent = await fs.readFile(path.join(outDir, 'hooks.ts'), 'utf8')
  })

  it('never imports *Payload types from api-contract', () => {
    const lines = hooksContent
      .split('\n')
      .filter(l => l.includes('./contract/api-contract'))
    for (const line of lines) {
      expect(line).not.toMatch(/Payload/)
    }
  })

  it('payload type imports (if any) come from api-schema', () => {
    // If hooks.ts references any *Payload type, the source must be api-schema
    const payloadTypeLines = hooksContent
      .split('\n')
      .filter(l => /\w+Payload/.test(l) && l.includes('from'))
    for (const line of payloadTypeLines) {
      expect(line).not.toContain('./contract/api-contract')
    }
  })
})

// ===========================================================================
// 5. File separation invariant — both files exist and exports are disjoint
// ===========================================================================

describe('File split invariant: both contract files must be generated', () => {
  it('api-schema.ts exists', async () => {
    const exists = await fs.pathExists(path.join(outDir, 'contract/api-schema.ts'))
    expect(exists).toBe(true)
  })

  it('api-contract.ts exists', async () => {
    const exists = await fs.pathExists(path.join(outDir, 'contract/api-contract.ts'))
    expect(exists).toBe(true)
  })

  it('api-schema.ts is non-empty', async () => {
    const stat = await fs.stat(path.join(outDir, 'contract/api-schema.ts'))
    expect(stat.size).toBeGreaterThan(0)
  })

  it('api-contract.ts is non-empty', async () => {
    const stat = await fs.stat(path.join(outDir, 'contract/api-contract.ts'))
    expect(stat.size).toBeGreaterThan(0)
  })

  it('api-schema.ts and api-contract.ts have disjoint exported names', async () => {
    const schema   = await fs.readFile(path.join(outDir, 'contract/api-schema.ts'), 'utf8')
    const contract = await fs.readFile(path.join(outDir, 'contract/api-contract.ts'), 'utf8')

    const extractExports = (src: string): Set<string> => {
      const names = new Set<string>()
      const re = /^export (?:const|type|function) (\w+)/gm
      let m: RegExpExecArray | null
      while ((m = re.exec(src)) !== null) names.add(m[1])
      return names
    }

    const schemaExports   = extractExports(schema)
    const contractExports = extractExports(contract)

    // Intersection must be empty
    const intersection = [...schemaExports].filter(n => contractExports.has(n))
    expect(intersection).toHaveLength(0)
  })
})
