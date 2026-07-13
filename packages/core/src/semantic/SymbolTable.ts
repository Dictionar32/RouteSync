import { ModelNode, ModelColumn, ModelAccessor, ModelRelation } from './types'

/**
 * Wraps one ModelNode with O(1) member lookup. Built once per model when
 * the SymbolTable is constructed, not per resolve() call — the column/
 * accessor/relation maps are real Maps, not re-scanned arrays.
 */
export class ModelSymbol {
  readonly name: string
  private readonly columnsByName: Map<string, ModelColumn>

  constructor(public readonly node: ModelNode) {
    this.name = node.name
    this.columnsByName = new Map()
    if (Array.isArray(node.columns)) {
      for (const c of node.columns) this.columnsByName.set(c.name, c)
    } else if (node.fields && typeof node.fields === 'object') {
      // legacy shape — ModelColumnResolver's old `else if (model.fields)`
      // branch, preserved so nothing that still produces this shape breaks.
      for (const [name, f] of Object.entries(node.fields)) {
        this.columnsByName.set(name, { name, type: f.type, nullable: f.nullable })
      }
    }
  }

  column(name: string): ModelColumn | undefined {
    return this.columnsByName.get(name)
  }

  accessor(name: string): ModelAccessor | undefined {
    return this.node.accessors?.[name]
  }

  relation(name: string): ModelRelation | undefined {
    return this.node.relations?.[name]
  }

  cast(columnName: string): string | undefined {
    return this.node.casts?.[columnName]
  }
}

/**
 * Replaces the `context.models.find(m => m.name === X)` scan repeated in
 * AccessorResolver, ConditionalWrapperResolver, VariableResolver (x2),
 * ExpressionResolver (x2), MethodReturnResolver, ModelColumnResolver —
 * every one of those was re-scanning the same array on every single field
 * resolved. Built once per scan/sync run instead.
 */
export class SymbolTable {
  private byName = new Map<string, ModelSymbol>()
  private byLowerName = new Map<string, ModelSymbol>()

  constructor(models: ModelNode[]) {
    for (const m of models) {
      const sym = new ModelSymbol(m)
      this.byName.set(m.name, sym)
      // first-write-wins on case-insensitive collisions — matches the old
      // Array.find() behavior, which always returned the first match too.
      const lower = m.name.toLowerCase()
      if (!this.byLowerName.has(lower)) this.byLowerName.set(lower, sym)
    }
  }

  /** Exact name match — same as `context.models.find(m => m.name === name)`. */
  get(name: string): ModelSymbol | undefined {
    return this.byName.get(name)
  }

  has(name: string): boolean {
    return this.byName.has(name)
  }

  /** Case-insensitive match — same as `context.models.find(m => m.name.toLowerCase() === name.toLowerCase())`. */
  getCaseInsensitive(name: string): ModelSymbol | undefined {
    return this.byLowerName.get(name.toLowerCase())
  }
}
