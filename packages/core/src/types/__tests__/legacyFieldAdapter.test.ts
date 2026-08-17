import { describe, expect, it } from 'vitest'
import {
  fieldFromParsedASTNode,
  fieldFromResourceFieldKind,
  fieldFromResponseMetadata,
} from '../legacyFieldAdapter'

describe('legacyFieldAdapter structured boundary', () => {
  it('maps resource fields through the legacy union discriminator', () => {
    const result = fieldFromResourceFieldKind({
      kind: 'object',
      fields: {
        totalHarga: {
          kind: 'primitive',
          type: 'number',
        },
        items: {
          kind: 'resource',
          resource: 'OrderItemResource',
          collection: true,
        },
      },
    })

    expect(result).toEqual({
      kind: 'object',
      fields: {
        totalHarga: {
          kind: 'primitive',
          type: 'number',
        },
        items: {
          kind: 'unknown',
          resolved: {
            status: 'resolved',
            type: 'resource',
            resource: 'OrderItemResource',
            collection: true,
            confidence: 100,
            trace: [
              {
                source: 'fieldFromResourceFieldKind',
                rule: 'legacy adapter',
                input: 'OrderItemResource',
                output: 'resource: OrderItemResource',
              },
            ],
          },
        },
      },
    })
  })

  it('maps response nested objects without a recursive assertion', () => {
    const result = fieldFromResponseMetadata({
      kind: 'object',
      fields: {
        gateway: {
          kind: 'object',
          fields: {
            token: {
              kind: 'primitive',
              type: 'string',
            },
          },
        },
      },
    })

    expect(result).toEqual({
      kind: 'object',
      fields: {
        gateway: {
          kind: 'object',
          fields: {
            token: {
              kind: 'primitive',
              type: 'string',
            },
          },
        },
      },
    })
  })

  it('requires the AST to declare the access kind explicitly', () => {
    const result = fieldFromParsedASTNode({
      kind: 'property_access',
      target: {
        kind: 'variable',
        name: 'order',
      },
      property: 'items',
      accessKind: 'optional_access',
    })

    expect(result).toMatchObject({
      kind: 'property_access',
      property: 'items',
      accessKind: 'optional_access',
    })
  })

  it('preserves explicit source code only when it is supplied or declared by unknown AST', () => {
    expect(
      fieldFromParsedASTNode({
        kind: 'unknown',
        code: '$order->id',
      }),
    ).toEqual({
      kind: 'unknown',
    })

    expect(
      fieldFromParsedASTNode(
        {
          kind: 'literal',
          value: 42,
        },
        '42',
      ),
    ).toEqual({
      kind: 'literal',
      originalCode: '42',
      value: 42,
    })
  })
})
