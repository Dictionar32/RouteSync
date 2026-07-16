import { describe, it, expect } from 'vitest'
import { VariableResolver } from '../../core/src/semantic/plugins/VariableResolver'
import { ResolutionContext, ModelNode } from '../../core/src/semantic/types'

describe('VariableResolver: plural to singular model mapping heuristics', () => {
  // Simple case-insensitive map mock for symbolTable
  const mockSymbolTable = {
    get: (key: string) => {
      if (key === 'Category') return { name: 'Category' } as ModelNode
      if (key === 'Product') return { name: 'Product' } as ModelNode
      return undefined
    },
    getCaseInsensitive: (key: string) => {
      const lower = key.toLowerCase()
      if (lower === 'category') return { name: 'Category' } as ModelNode
      if (lower === 'product') return { name: 'Product' } as ModelNode
      return undefined
    }
  } as any

  const mockContext = {
    symbolTable: mockSymbolTable,
    cycleDetector: {
      enter: () => true,
      leave: () => {}
    },
    kernel: {
      resolve: () => ({ status: 'resolved', type: 'model', model: 'Category', confidence: 100, trace: [] })
    }
  } as unknown as ResolutionContext

  const resolver = new VariableResolver()

  it('should resolve direct singular name Category', () => {
    const res = resolver.resolve({ kind: 'variable', name: 'category' }, mockContext)
    expect(res.status).toBe('resolved')
    expect(res.type).toBe('model')
    expect(res.model).toBe('Category')
    expect(res.collection).toBeFalsy()
  })

  it('should resolve plural name ending with -ies (categories -> Category) with collection: true', () => {
    const res = resolver.resolve({ kind: 'variable', name: 'categories' }, mockContext)
    expect(res.status).toBe('resolved')
    expect(res.type).toBe('model')
    expect(res.model).toBe('Category')
    expect(res.collection).toBe(true)
  })

  it('should resolve plural name ending with -s (products -> Product) with collection: true', () => {
    const res = resolver.resolve({ kind: 'variable', name: 'products' }, mockContext)
    expect(res.status).toBe('resolved')
    expect(res.type).toBe('model')
    expect(res.model).toBe('Product')
    expect(res.collection).toBe(true)
  })

  it('should resolve compound plural name using suffix heuristic (reviews -> ProductReview) with collection: true', () => {
    const customSymbolTable = {
      ...mockSymbolTable,
      get: (key: string) => {
        if (key === 'ProductReview') return { name: 'ProductReview' } as ModelNode
        return mockSymbolTable.get(key)
      },
      getCaseInsensitive: (key: string) => {
        const lower = key.toLowerCase()
        if (lower === 'productreview') return { name: 'ProductReview' } as ModelNode
        return mockSymbolTable.getCaseInsensitive(key)
      },
      findFirst: (predicate: (entry: { name: string }) => boolean) => {
        const mockModels = [{ name: 'Category' }, { name: 'Product' }, { name: 'ProductReview' }]
        return mockModels.find(predicate)
      }
    } as any

    const res = resolver.resolve({ kind: 'variable', name: 'reviews' }, {
      ...mockContext,
      symbolTable: customSymbolTable
    } as any)

    expect(res.status).toBe('resolved')
    expect(res.type).toBe('model')
    expect(res.model).toBe('ProductReview')
    expect(res.collection).toBe(true)
  })

  it('should return unknown for non-matching variables', () => {
    const res = resolver.resolve({ kind: 'variable', name: 'somethingElse' }, mockContext)
    expect(res.status).toBe('unknown')
  })
})
