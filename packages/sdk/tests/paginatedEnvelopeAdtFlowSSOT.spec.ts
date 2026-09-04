import { describe, test, expect } from 'vitest'
import {
  matchPaginatedEnvelope,
  matchPaginationKind,
  PAGINATION_KIND_REGISTRY,
  PaginationKind,
  LengthAwarePaginatedEnvelopeDescriptor,
  CursorPaginatedEnvelopeDescriptor,
  ScannedPaginatedEnvelopeDescriptor
} from '../../core/src'

describe('PaginatedEnvelope ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchPaginatedEnvelope executes pure catamorphism for LengthAware envelope', () => {
    const env: LengthAwarePaginatedEnvelopeDescriptor = ScannedPaginatedEnvelopeDescriptor.lengthAware('items')

    const result = matchPaginatedEnvelope(env, {
      length_aware: (e) => `LENGTH_AWARE:${e.dataKey}:${e.linksKey}:${e.envelopeTypeName}`,
      cursor: (e) => `CURSOR:${e.dataKey}`
    })

    expect(result).toBe('LENGTH_AWARE:items:links:PaginatedResponse<T>')
    expect(env.kind).toBe('length_aware')
    expect(env.dataKey).toBe('items')
    expect(env.linksKey).toBe('links')
    expect(env.envelopeTypeName).toBe('PaginatedResponse<T>')
  })

  test('2. matchPaginatedEnvelope executes pure catamorphism for Cursor envelope', () => {
    const env: CursorPaginatedEnvelopeDescriptor = ScannedPaginatedEnvelopeDescriptor.cursor('items')

    const result = matchPaginationKind(env, {
      length_aware: (e) => `LENGTH_AWARE:${e.dataKey}`,
      cursor: (e) => `CURSOR:${e.dataKey}:${e.linksKey}:${e.envelopeTypeName}`
    })

    expect(result).toBe('CURSOR:items:null:CursorPaginatedResponse<T>')
    expect(env.kind).toBe('cursor')
    expect(env.dataKey).toBe('items')
    expect(env.linksKey).toBeNull()
    expect(env.envelopeTypeName).toBe('CursorPaginatedResponse<T>')
  })

  test('3. PAGINATION_KIND_REGISTRY enforces frozen specifications for all pagination kinds', () => {
    expect(Object.isFrozen(PAGINATION_KIND_REGISTRY)).toBe(true)

    expect(PAGINATION_KIND_REGISTRY[PaginationKind.LengthAware]).toEqual({
      kind: PaginationKind.LengthAware,
      defaultDataKey: 'data',
      defaultMetaKey: 'meta',
      defaultLinksKey: 'links',
      defaultEnvelopeTypeName: 'PaginatedResponse<T>',
      hasPageLinks: true,
      isCursorBased: false
    })

    expect(PAGINATION_KIND_REGISTRY[PaginationKind.Cursor]).toEqual({
      kind: PaginationKind.Cursor,
      defaultDataKey: 'data',
      defaultMetaKey: 'meta',
      defaultLinksKey: null,
      defaultEnvelopeTypeName: 'CursorPaginatedResponse<T>',
      hasPageLinks: false,
      isCursorBased: true
    })
  })

  test('4. ScannedPaginatedEnvelopeDescriptor semantic factories produce frozen instances', () => {
    const lenAware = ScannedPaginatedEnvelopeDescriptor.lengthAware('orders', 'page_links', 'OrderPagination<T>')
    const cursor = ScannedPaginatedEnvelopeDescriptor.cursor('messages', 'MessageCursor<T>')

    expect(Object.isFrozen(lenAware)).toBe(true)
    expect(lenAware.dataKey).toBe('orders')
    expect(lenAware.linksKey).toBe('page_links')
    expect(lenAware.envelopeTypeName).toBe('OrderPagination<T>')

    expect(Object.isFrozen(cursor)).toBe(true)
    expect(cursor.dataKey).toBe('messages')
    expect(cursor.linksKey).toBeNull()
    expect(cursor.envelopeTypeName).toBe('MessageCursor<T>')
  })

  test('5. ScannedPaginatedEnvelopeDescriptor.create dispatches defaults from registry', () => {
    const defaultLenAware = ScannedPaginatedEnvelopeDescriptor.create()
    const defaultCursor = ScannedPaginatedEnvelopeDescriptor.create({ kind: PaginationKind.Cursor })

    expect(defaultLenAware.kind).toBe('length_aware')
    expect(defaultLenAware.dataKey).toBe('data')
    expect(defaultLenAware.linksKey).toBe('links')
    expect(defaultLenAware.envelopeTypeName).toBe('PaginatedResponse<T>')

    expect(defaultCursor.kind).toBe('cursor')
    expect(defaultCursor.dataKey).toBe('data')
    expect(defaultCursor.linksKey).toBeNull()
    expect(defaultCursor.envelopeTypeName).toBe('CursorPaginatedResponse<T>')
  })

  test('6. Pure functional pagination unpacker extracts pagination controls without branching', () => {
    const envelopes = [
      ScannedPaginatedEnvelopeDescriptor.lengthAware('users'),
      ScannedPaginatedEnvelopeDescriptor.cursor('logs')
    ]

    const paginationHooks = envelopes.map(env => matchPaginatedEnvelope(env, {
      length_aware: (e) => ({
        hook: 'useStandardPagination',
        dataProp: e.dataKey,
        metaProp: e.metaKey,
        linksProp: e.linksKey
      }),
      cursor: (e) => ({
        hook: 'useInfiniteCursorPagination',
        dataProp: e.dataKey,
        metaProp: e.metaKey,
        linksProp: null
      })
    }))

    expect(paginationHooks).toEqual([
      {
        hook: 'useStandardPagination',
        dataProp: 'users',
        metaProp: 'meta',
        linksProp: 'links'
      },
      {
        hook: 'useInfiniteCursorPagination',
        dataProp: 'logs',
        metaProp: 'meta',
        linksProp: null
      }
    ])
  })
})
