import { describe, it, expect, beforeAll } from 'vitest'
import { CompilerBridge } from '../../cli/src/generators/CompilerBridge'
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

describe('CompilerBridge: Contract and Form generation', () => {
  let contractCode: string
  let formCode: string

  beforeAll(async () => {
    const contractRes = await CompilerBridge.generateContractTypes(makeManifest())
    contractCode = contractRes.code
    const formRes = await CompilerBridge.generateFormTypes(makeManifest())
    formCode = formRes.code
  })

  it('exports productsContractSchema for routes with schema rules', () => {
    expect(contractCode).toContain('productsContractSchema')
  })

  it('exports ProductsForm for form types', () => {
    expect(formCode).toContain('export type ProductsForm = {')
  })

  it('contains correctly typed fields in form', () => {
    expect(formCode).toContain('name: string')
    expect(formCode).toContain('price: number')
    expect(formCode).toContain('stock: number')
  })
})
