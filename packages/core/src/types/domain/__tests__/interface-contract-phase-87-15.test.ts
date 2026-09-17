import { describe, expect, it } from 'vitest'
import type { FieldNode } from '../../field'
import type { IRRawNode } from '../../semantic/irHints'
import type { SemanticKernelV2 } from '../../semantic/kernelTypes'

describe('Phase 87.15 canonical AST contract', () => {
  it('uses FieldNode as the only active AST carrier for IR raw nodes', () => {
    const field: FieldNode = Object.freeze({
      kind: 'variable',
      originalCode: '$request',
      source: { file: 'Controller.php', line: 10, column: 5, context: 'route' },
      name: { kind: 'variable_name', value: 'request' },
    })

    const raw: IRRawNode = {
      kind: 'raw_code',
      code: '$request',
      hints: { pattern: 'unknown', confidence: 1, nullable: false, framework_context: 'unknown' },
      parsed_ast: field,
    }

    expect(raw.parsed_ast).toBe(field)
  })

  it('requires SemanticKernelV2 to resolve the canonical FieldNode', () => {
    const kernel: SemanticKernelV2 = {
      resolve: (node) => ({
        type: { kind: 'unknown' },
        status: { kind: 'unresolved' },
        trace: [],
      }),
    }

    expect(kernel).toBeDefined()
  })
})
