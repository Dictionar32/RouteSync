import { describe, it, expect } from 'vitest'
import { ContractGraph, isResolvedField } from '@routesync/core'
import { RouteManifest } from '@routesync/core'

describe('ContractGraph Compiler IR', () => {
  it('should build a compiled, indexed OO graph from a manifest', () => {
    const manifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      routes: [
        {
          name: 'produk.index',
          method: 'GET',
          path: '/produk',
          auth: false,
          middleware: []
        }
      ],
      models: [
        {
          name: 'OrderDetail',
          table: 'order_details',
          columns: [
            { name: 'id', type: 'bigint(20) unsigned', nullable: false },
            { name: 'qty', type: 'int(11)', nullable: false }
          ]
        }
      ],
      resources: [
        {
          name: 'OrderDetailResource',
          fields: {
            id: {
              name: 'id',
              resolved: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            } as any,
            qty: {
              name: 'qty',
              resolved: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            } as any
          }
        }
      ]
    }

    const graph = new ContractGraph(manifest)

    // Verify O(1) model lookup
    const model = graph.model('OrderDetail')
    expect(model).toBeDefined()
    expect(model?.table).toBe('order_details')

    // Verify O(1) resource lookup
    const resource = graph.resource('OrderDetailResource')
    expect(resource).toBeDefined()
    expect(resource?.name).toBe('OrderDetailResource')

    // Verify resource fields are indexed by reference (pointer-based Record)
    expect(resource?.fields['id']).toBeDefined()
    expect(resource?.fields['qty']).toBeDefined()

    // Verify type-guard works as expected
    const idField = resource?.fields['id']
    expect(idField).toBeDefined()
    if (idField && isResolvedField(idField)) {
      expect(idField.resolved.type).toBe('number')
    } else {
      throw new Error('Type guard isResolvedField failed')
    }

    // Verify Controller indexing
    const controller = graph.controller('ProdukController')
    expect(controller).toBeDefined()
    expect(controller?.routes.length).toBe(1)
    expect(controller?.routes[0].name).toBe('produk.index')

    // Verify dependency indexing (resource -> model)
    const linkedModel = graph.getModelForResource('OrderDetailResource')
    expect(linkedModel).toBeDefined()
    expect(linkedModel?.name).toBe('OrderDetail')
  })
})
