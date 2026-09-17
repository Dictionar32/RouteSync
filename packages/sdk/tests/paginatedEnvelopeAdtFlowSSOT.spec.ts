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
      length_aware: (e) => `LENGTH_AWARE:${e.dataKey.value}:${e.linksKey.kind === 'links_key' ? e.linksKey.key.value : e.linksKey.kind}:${e.envelopeTypeName.value}`,
      cursor: (e) => `CURSOR:${e.dataKey.value}`
    })

    expect(result).toBe('LENGTH_AWARE:items:links:PaginatedResponse<T>')
    expect(env.kind).toBe('length_aware')
    expect(env.dataKey.value).toBe('items')
    expect(env.linksKey.kind).toBe('links_key')
    if (env.linksKey.kind === 'links_key') expect(env.linksKey.key.value).toBe('links')
    expect(env.envelopeTypeName.value).toBe('PaginatedResponse<T>')
  })

  test('2. matchPaginatedEnvelope executes pure catamorphism for Cursor envelope', () => {
    const env: CursorPaginatedEnvelopeDescriptor = ScannedPaginatedEnvelopeDescriptor.cursor('items')

    const result = matchPaginationKind(env, {
      length_aware: (e) => `LENGTH_AWARE:${e.dataKey.value}`,
      cursor: (e) => `CURSOR:${e.dataKey.value}:${e.linksKey.kind}:${e.envelopeTypeName.value}`
    })

    expect(result).toBe('CURSOR:items:no_links_key:CursorPaginatedResponse<T>')
    expect(env.kind).toBe('cursor')
    expect(env.dataKey.value).toBe('items')
    expect(env.linksKey.kind).toBe('no_links_key')
    expect(env.envelopeTypeName.value).toBe('CursorPaginatedResponse<T>')
  })

  test('3. PAGINATION_KIND_REGISTRY enforces frozen specifications for all pagination kinds', () => {
    expect(Object.isFrozen(PAGINATION_KIND_REGISTRY)).toBe(true)

    expect(PAGINATION_KIND_REGISTRY[PaginationKind.LengthAware]).toEqual({
      kind: PaginationKind.LengthAware,
      defaultDataKey: { kind: 'response_data_key', value: 'data' },
      defaultMetaKey: { kind: 'response_meta_key', value: 'meta' },
      defaultLinksKey: { kind: 'links_key', key: { kind: 'response_links_key', value: 'links' } },
      defaultEnvelopeTypeName: { kind: 'envelope_type_name', value: 'PaginatedResponse<T>' },
    })

    expect(PAGINATION_KIND_REGISTRY[PaginationKind.Cursor]).toEqual({
      kind: PaginationKind.Cursor,
      defaultDataKey: { kind: 'response_data_key', value: 'data' },
      defaultMetaKey: { kind: 'response_meta_key', value: 'meta' },
      defaultLinksKey: { kind: 'no_links_key' },
      defaultEnvelopeTypeName: { kind: 'envelope_type_name', value: 'CursorPaginatedResponse<T>' },
    })
  })

  test('4. ScannedPaginatedEnvelopeDescriptor semantic factories produce frozen instances', () => {
    const lenAware = ScannedPaginatedEnvelopeDescriptor.lengthAware('orders', 'page_links', 'OrderPagination<T>')
    const cursor = ScannedPaginatedEnvelopeDescriptor.cursor('messages', 'MessageCursor<T>')

    expect(Object.isFrozen(lenAware)).toBe(true)
    expect(lenAware.dataKey.value).toBe('orders')
    expect(lenAware.linksKey.kind).toBe('links_key')
    if (lenAware.linksKey.kind === 'links_key') expect(lenAware.linksKey.key.value).toBe('page_links')
    expect(lenAware.envelopeTypeName.value).toBe('OrderPagination<T>')

    expect(Object.isFrozen(cursor)).toBe(true)
    expect(cursor.dataKey.value).toBe('messages')
    expect(cursor.linksKey.kind).toBe('no_links_key')
    expect(cursor.envelopeTypeName.value).toBe('MessageCursor<T>')
  })

  test('5. ScannedPaginatedEnvelopeDescriptor.create dispatches defaults from registry', () => {
    const defaultLenAware = ScannedPaginatedEnvelopeDescriptor.create()
    const defaultCursor = ScannedPaginatedEnvelopeDescriptor.create({ kind: PaginationKind.Cursor })

    expect(defaultLenAware.kind).toBe('length_aware')
    expect(defaultLenAware.dataKey.value).toBe('data')
    expect(defaultLenAware.linksKey.kind).toBe('links_key')
    expect(defaultLenAware.envelopeTypeName.value).toBe('PaginatedResponse<T>')

    expect(defaultCursor.kind).toBe('cursor')
    expect(defaultCursor.dataKey.value).toBe('data')
    expect(defaultCursor.linksKey.kind).toBe('no_links_key')
    expect(defaultCursor.envelopeTypeName.value).toBe('CursorPaginatedResponse<T>')
  })

  test('6. Pure functional pagination unpacker extracts pagination controls without branching', () => {
    const envelopes = [
      ScannedPaginatedEnvelopeDescriptor.lengthAware('users'),
      ScannedPaginatedEnvelopeDescriptor.cursor('logs')
    ]

    const paginationHooks = envelopes.map(env => matchPaginatedEnvelope(env, {
      length_aware: (e) => ({
        hook: 'useStandardPagination',
        dataProp: e.dataKey.value,
        metaProp: e.metaKey.value,
        linksProp: e.linksKey.kind === 'links_key' ? e.linksKey.key.value : e.linksKey.kind
      }),
      cursor: (e) => ({
        hook: 'useInfiniteCursorPagination',
        dataProp: e.dataKey.value,
        metaProp: e.metaKey.value,
        linksProp: 'no_links_key'
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
        linksProp: 'no_links_key'
      }
    ])
  })
})
