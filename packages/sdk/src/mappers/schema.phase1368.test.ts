import { describe, expect, it } from 'vitest'
import type { RouteParserSchema } from '@routesync/core'
import { isSchemaLike, parseWithSchema } from './schema'

const stringParser: RouteParserSchema<string> = {
  parse(value) {
    if (typeof value !== 'string') throw new Error('expected string')
    return value
  },
  safeParse(value) {
    return typeof value === 'string'
      ? { success: true, data: value }
      : { success: false, error: new Error('expected string') }
  },
}

describe('Phase 1368 upstream parser contract', () => {
  it('recognizes the canonical parser contract', () => {
    expect(isSchemaLike(stringParser)).toBe(true)
    expect(isSchemaLike({ parse: (value: unknown) => value })).toBe(false)
    expect(isSchemaLike((value: unknown) => value)).toBe(true)
  })

  it('uses the result-based parser and returns validated data', () => {
    expect(parseWithSchema(stringParser, 'valid')).toBe('valid')
  })

  it('throws the parser error instead of passing invalid input through as T', () => {
    expect(() => parseWithSchema(stringParser, 42)).toThrow('expected string')
  })

  it('supports function schemas as explicit parser boundaries', () => {
    expect(parseWithSchema((value: unknown) => String(value), 42)).toBe('42')
  })
})
