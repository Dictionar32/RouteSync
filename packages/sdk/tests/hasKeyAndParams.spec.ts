import { describe, it, expect } from 'vitest'
import { hasKey } from '../../react/src/hooks/defineHooks'
import { type ExtractRouteParams } from '../src/index'

describe('RouteSync Core Fixes', () => {
  describe('hasKey helper', () => {
    it('should return true for keys present on objects', () => {
      const obj = { create: 123 }
      expect(hasKey(obj, 'create')).toBe(true)
      expect(hasKey(obj, 'nonexistent')).toBe(false)
    })

    it('should return true for keys present on functions (callable objects)', () => {
      const fn = Object.assign(() => {}, { create: 123 })
      expect(hasKey(fn, 'create')).toBe(true)
      expect(hasKey(fn, 'nonexistent')).toBe(false)
    })

    it('should return false for null/undefined or non-matching inputs', () => {
      expect(hasKey(null, 'create')).toBe(false)
      expect(hasKey(undefined, 'create')).toBe(false)
      expect(hasKey(42, 'toString')).toBe(false)
    })
  })

  describe('ExtractRouteParams type compiler', () => {
    it('should compile correct types for route paths', () => {
      // 1. String path parameter extraction
      const stringPathParams: ExtractRouteParams<"/produk/:id"> = { id: '10' }
      expect(stringPathParams.id).toBe('10')

      // @ts-expect-error (id must be present)
      const missingId: ExtractRouteParams<"/produk/:id"> = {}

      // 2. Function path parameter extraction (contravariance resolved to Record<string, unknown>)
      type FuncPath = (id: string | number) => string
      const funcPathParams: ExtractRouteParams<FuncPath> = { id: 42, custom: 'any-key' }
      expect(funcPathParams.id).toBe(42)
      expect(funcPathParams.custom).toBe('any-key')
    })
  })
})
