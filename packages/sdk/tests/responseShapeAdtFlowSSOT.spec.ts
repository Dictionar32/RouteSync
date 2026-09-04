import { describe, test, expect } from 'vitest'
import {
  ResponseShape,
  RESPONSE_SHAPE_REGISTRY,
  matchResponseShape,
  ResponseShapeVisitor
} from '../../core/src'

describe('ResponseShape ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchResponseShape executes pure catamorphism for all 3 shapes without if/switch', () => {
    const visitor: ResponseShapeVisitor<string> = {
      paginated: (spec) => `PAGINATED:${spec.isPaginated}:${spec.defaultWrapperKey}`,
      collection: (spec) => `COLLECTION:${spec.isCollection}:${spec.defaultWrapperKey}`,
      single: (spec) => `SINGLE:${spec.isSingle}:${spec.defaultWrapperKey ?? 'none'}`
    }

    expect(matchResponseShape(ResponseShape.Paginated, visitor)).toBe('PAGINATED:true:data')
    expect(matchResponseShape(ResponseShape.Collection, visitor)).toBe('COLLECTION:true:data')
    expect(matchResponseShape(ResponseShape.Single, visitor)).toBe('SINGLE:true:none')
  })

  test('2. matchResponseShape accepts descriptor objects with shape property', () => {
    const responseDesc = { shape: ResponseShape.Paginated, readTypeName: 'OrderRead' }

    const result = matchResponseShape(responseDesc, {
      paginated: () => 'WRAPPER_PAGINATED',
      collection: () => 'WRAPPER_COLLECTION',
      single: () => 'WRAPPER_SINGLE'
    })

    expect(result).toBe('WRAPPER_PAGINATED')
  })

  test('3. RESPONSE_SHAPE_REGISTRY provides frozen O(1) specifications for all 3 shapes', () => {
    expect(Object.isFrozen(RESPONSE_SHAPE_REGISTRY)).toBe(true)

    const allShapes: readonly ResponseShape[] = Object.values(ResponseShape)
    expect(allShapes.length).toBe(3)

    for (const shape of allShapes) {
      const spec = RESPONSE_SHAPE_REGISTRY[shape]
      expect(spec).toBeDefined()
      expect(spec.shape).toBe(shape)
      expect(typeof spec.isCollection).toBe('boolean')
      expect(typeof spec.isPaginated).toBe('boolean')
      expect(typeof spec.isSingle).toBe('boolean')
      expect(typeof spec.description).toBe('string')
    }

    // Paginated
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Paginated].isCollection).toBe(true)
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Paginated].isPaginated).toBe(true)
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Paginated].isSingle).toBe(false)
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Paginated].defaultWrapperKey).toBe('data')

    // Collection
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Collection].isCollection).toBe(true)
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Collection].isPaginated).toBe(false)
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Collection].isSingle).toBe(false)
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Collection].defaultWrapperKey).toBe('data')

    // Single
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Single].isCollection).toBe(false)
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Single].isPaginated).toBe(false)
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Single].isSingle).toBe(true)
    expect(RESPONSE_SHAPE_REGISTRY[ResponseShape.Single].defaultWrapperKey).toBeNull()
  })

  test('4. Zero-if pipeline for wrapping response types using RESPONSE_SHAPE_REGISTRY', () => {
    const endpoints = [
      { path: '/api/orders', shape: ResponseShape.Paginated, itemType: 'Order' },
      { path: '/api/categories', shape: ResponseShape.Collection, itemType: 'Category' },
      { path: '/api/orders/{id}', shape: ResponseShape.Single, itemType: 'Order' }
    ]

    const typeSignatures = endpoints.map(e => {
      const spec = RESPONSE_SHAPE_REGISTRY[e.shape]
      return matchResponseShape(e.shape, {
        paginated: () => `PaginatedResponse<${e.itemType}>`,
        collection: () => `CollectionResponse<${e.itemType}>`,
        single: () => `${e.itemType}`
      })
    })

    expect(typeSignatures).toEqual([
      'PaginatedResponse<Order>',
      'CollectionResponse<Category>',
      'Order'
    ])
  })
})
