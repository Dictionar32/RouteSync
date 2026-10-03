import { describe, expect, test } from 'vitest'
import { resourceOperationType } from '../../core/src/compiler/scanner/subscanners/resource/resourceFieldProducer'

const method = (property: string, args: any[] = []): any => ({ kind: 'method_chain', property, arguments: args })
const literal = (value: string): any => ({ kind: 'literal', literalType: 'string', value })
const number = (value: number): any => ({ kind: 'literal', literalType: 'number', value })

const model = {
  property: () => undefined,
} as any

describe('Laravel 13 Resource producer semantics', () => {
  test('producer types whenCounted as number', () => {
    expect(resourceOperationType(method('whenCounted', [{ value: literal('posts') }]), model))
      .toEqual({ kind: 'primitive', value: { kind: 'number' } })
  })

  test('producer types whenExistsLoaded as boolean', () => {
    expect(resourceOperationType(method('whenExistsLoaded', [{ value: literal('posts') }]), model))
      .toEqual({ kind: 'primitive', value: { kind: 'boolean' } })
  })

  test('producer types whenAggregated as nullable number', () => {
    expect(resourceOperationType(method('whenAggregated', [
      { value: literal('posts') },
      { value: literal('rating') },
      { value: literal('avg') },
    ]), model)).toEqual({
      kind: 'nullable',
      value: { kind: 'primitive', value: { kind: 'number' } },
    })
  })

  test('producer preserves explicit conditional value type', () => {
    expect(resourceOperationType(method('when', [
      { value: number(1) },
      { value: { kind: 'literal', literalType: 'string', value: 'active' } },
    ]), model)).toEqual({ kind: 'primitive', value: { kind: 'string' } })
  })
})
