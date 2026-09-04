import { describe, test, expect } from 'vitest'
import {
  ResolvedPrimitiveType,
  ResolvedReferenceType,
  ResolvedOptionalType,
  ResolvedNullableType,
  ResolvedCollectionType,
  ResolvedObjectType,
  ResolvedUnionType,
  ResolvedIntersectionType,
  ResolvedUnknownType,
  ResolvedSemanticTypeKind,
  RESOLVED_SEMANTIC_TYPE_REGISTRY,
  matchResolvedSemanticType,
  ResolvedSemanticTypeVisitor,
  ResolvedSemanticType
} from '../../core/src'

describe('ResolvedSemanticType ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchResolvedSemanticType executes pure catamorphism on leaf types (primitive, reference, unknown)', () => {
    const prim = ResolvedPrimitiveType.string()
    const ref = ResolvedReferenceType.named('UserDTO')
    const unk = ResolvedUnknownType.withMessage('Not found')

    const visitor: ResolvedSemanticTypeVisitor<string> = {
      primitive: (p) => `PRIM:${p.primitiveKind}`,
      reference: (r) => `REF:${r.name}`,
      optional: () => 'OPT',
      nullable: () => 'NULL',
      collection: () => 'COLL',
      object: () => 'OBJ',
      union: () => 'UNION',
      intersection: () => 'INTER',
      unknown: (u) => `UNK:${u.diagnosticMessage}`
    }

    expect(matchResolvedSemanticType(prim, visitor)).toBe('PRIM:string')
    expect(matchResolvedSemanticType(ref, visitor)).toBe('REF:UserDTO')
    expect(matchResolvedSemanticType(unk, visitor)).toBe('UNK:Not found')
  })

  test('2. matchResolvedSemanticType executes pure catamorphism on unary wrapper types (optional, nullable, collection)', () => {
    const opt = ResolvedOptionalType.of(ResolvedPrimitiveType.number())
    const nullType = ResolvedNullableType.of(ResolvedPrimitiveType.string())
    const coll = ResolvedCollectionType.of(ResolvedPrimitiveType.boolean())

    const visitor: ResolvedSemanticTypeVisitor<string> = {
      primitive: () => 'PRIM',
      reference: () => 'REF',
      optional: (o) => `OPT<${o.innerType.kind}>`,
      nullable: (n) => `NULL<${n.innerType.kind}>`,
      collection: (c) => `COLL<${c.elementType.kind}>`,
      object: () => 'OBJ',
      union: () => 'UNION',
      intersection: () => 'INTER',
      unknown: () => 'UNK'
    }

    expect(matchResolvedSemanticType(opt, visitor)).toBe('OPT<primitive>')
    expect(matchResolvedSemanticType(nullType, visitor)).toBe('NULL<primitive>')
    expect(matchResolvedSemanticType(coll, visitor)).toBe('COLL<primitive>')
  })

  test('3. matchResolvedSemanticType executes pure catamorphism on compound types (object, union, intersection)', () => {
    const obj = ResolvedObjectType.resource('OrderResource', [['id', ResolvedPrimitiveType.number()]])
    const union = ResolvedUnionType.of([ResolvedPrimitiveType.string(), ResolvedPrimitiveType.number()])
    const inter = ResolvedIntersectionType.of([ResolvedReferenceType.named('A'), ResolvedReferenceType.named('B')])

    const visitor: ResolvedSemanticTypeVisitor<string> = {
      primitive: () => 'PRIM',
      reference: () => 'REF',
      optional: () => 'OPT',
      nullable: () => 'NULL',
      collection: () => 'COLL',
      object: (o) => `OBJ:${o.objectKind}:${o.fields.length}`,
      union: (u) => `UNION:${u.members.length}`,
      intersection: (i) => `INTER:${i.members.length}`,
      unknown: () => 'UNK'
    }

    expect(matchResolvedSemanticType(obj, visitor)).toBe('OBJ:resource:1')
    expect(matchResolvedSemanticType(union, visitor)).toBe('UNION:2')
    expect(matchResolvedSemanticType(inter, visitor)).toBe('INTER:2')
  })

  test('4. RESOLVED_SEMANTIC_TYPE_REGISTRY provides frozen O(1) specifications for all 9 kinds', () => {
    expect(Object.isFrozen(RESOLVED_SEMANTIC_TYPE_REGISTRY)).toBe(true)

    const allKinds: readonly ResolvedSemanticTypeKind[] = Object.values(ResolvedSemanticTypeKind)
    expect(allKinds.length).toBe(9)

    for (const kind of allKinds) {
      const spec = RESOLVED_SEMANTIC_TYPE_REGISTRY[kind]
      expect(spec).toBeDefined()
      expect(spec.kind).toBe(kind)
      expect(typeof spec.isTerminal).toBe('boolean')
      expect(typeof spec.isWrapper).toBe('boolean')
      expect(typeof spec.isCompound).toBe('boolean')
      expect(typeof spec.description).toBe('string')
    }

    // Terminal leaves
    expect(RESOLVED_SEMANTIC_TYPE_REGISTRY[ResolvedSemanticTypeKind.Primitive].isTerminal).toBe(true)
    expect(RESOLVED_SEMANTIC_TYPE_REGISTRY[ResolvedSemanticTypeKind.Reference].isTerminal).toBe(true)
    expect(RESOLVED_SEMANTIC_TYPE_REGISTRY[ResolvedSemanticTypeKind.Unknown].isTerminal).toBe(true)

    // Unary wrappers
    expect(RESOLVED_SEMANTIC_TYPE_REGISTRY[ResolvedSemanticTypeKind.Optional].isWrapper).toBe(true)
    expect(RESOLVED_SEMANTIC_TYPE_REGISTRY[ResolvedSemanticTypeKind.Nullable].isWrapper).toBe(true)
    expect(RESOLVED_SEMANTIC_TYPE_REGISTRY[ResolvedSemanticTypeKind.Collection].isWrapper).toBe(true)

    // Compound branches
    expect(RESOLVED_SEMANTIC_TYPE_REGISTRY[ResolvedSemanticTypeKind.Object].isCompound).toBe(true)
    expect(RESOLVED_SEMANTIC_TYPE_REGISTRY[ResolvedSemanticTypeKind.Union].isCompound).toBe(true)
    expect(RESOLVED_SEMANTIC_TYPE_REGISTRY[ResolvedSemanticTypeKind.Intersection].isCompound).toBe(true)
  })

  test('5. Pure catamorphism recursively printing TypeScript definitions without if/switch', () => {
    const printTs = (type: ResolvedSemanticType): string => {
      return matchResolvedSemanticType(type, {
        primitive: (p) => p.primitiveKind,
        reference: (r) => r.name,
        optional: (o) => `${printTs(o.innerType)} | undefined`,
        nullable: (n) => `${printTs(n.innerType)} | null`,
        collection: (c) => `readonly ${printTs(c.elementType)}[]`,
        object: (o) => `{ ${o.fields.map(([k, v]) => `${k}: ${printTs(v)}`).join('; ')} }`,
        union: (u) => u.members.map(printTs).join(' | '),
        intersection: (i) => i.members.map(printTs).join(' & '),
        unknown: () => 'unknown'
      })
    }

    const complexType = ResolvedObjectType.resource('OrderResource', [
      ['id', ResolvedPrimitiveType.number()],
      ['name', ResolvedPrimitiveType.string()],
      ['tags', ResolvedCollectionType.of(ResolvedPrimitiveType.string())],
      ['deleted_at', ResolvedNullableType.of(ResolvedPrimitiveType.string())]
    ])

    expect(printTs(complexType)).toBe(
      '{ id: number; name: string; tags: readonly string[]; deleted_at: string | null }'
    )
  })
})
