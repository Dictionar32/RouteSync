import { describe, expect, it } from 'vitest'
import type { RouteDefinition, RouteParserSchema } from '@routesync/core'
import { parseRouteSchema } from './schemaMapper'

const requiredString: RouteParserSchema<string> = {
  parse(value) {
    if (typeof value !== 'string') throw new Error('required string')
    return value
  },
  safeParse(value) {
    return typeof value === 'string'
      ? { success: true, data: value }
      : { success: false, error: new Error('required string') }
  },
}

describe('Phase 1368 schema mapper boundary', () => {
  it('does not skip undefined when a schema is configured', () => {
    const route = {
      schema: { body: requiredString },
      schemaRole: 'request',
    } as unknown as RouteDefinition

    expect(() => parseRouteSchema(route, 'body', undefined)).toThrow('required string')
  })

  it('preserves unknown values only when the selected schema is absent', () => {
    const route = { schema: undefined } as unknown as RouteDefinition
    expect(parseRouteSchema(route, 'body', undefined)).toBeUndefined()
    expect(parseRouteSchema(route, 'body', { raw: true })).toEqual({ raw: true })
  })

  it('rejects malformed configured schema objects', () => {
    const route = {
      schema: { body: { description: 'not a parser' } },
      schemaRole: 'request',
    } as unknown as RouteDefinition

    expect(() => parseRouteSchema(route, 'body', 'input')).toThrow('does not satisfy the upstream parser contract')
  })
})
