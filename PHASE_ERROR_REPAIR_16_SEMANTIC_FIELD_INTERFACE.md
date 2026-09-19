# Phase Error Repair 16 — Semantic Field Interface

## Root
`types/semantic/semanticTypes.ts` masih memodelkan `PropertyName` sebagai key primitive `string` dan lookup memakai `undefined`.

## Trace
```text
PropertyName ADT
  -> SemanticFieldEntry
  -> SemanticFieldSet
  -> lookup
```

Masalah sebelumnya:
- `_lookup: ReadonlyMap<string, SemanticType>`
- `get(name): SemanticType | undefined`
- `getType(name): SemanticType | undefined`
- `SemanticNode.fields?: SemanticFieldSet`

## Repair
Interface dinaikkan menjadi model semantic:

```text
SemanticFieldEntry
  ├── name: PropertyName
  └── type: SemanticType

SemanticFieldLookup
  ├── found { entry }
  └── missing { name }

SemanticFieldSet
  └── lookup(PropertyName): SemanticFieldLookup
```

`SemanticNode.fields` sekarang required pada canonical semantic interface.

Primitive string hanya dipakai sebagai implementation index internal untuk canonical key; tidak bocor ke API semantic.

## Verification
Targeted narrow compile:

- `semanticTypes.ts` diagnostics: 0
- `PropertyName -> string` diagnostics: 0
- semantic field lookup diagnostics: 0

Remaining unrelated roots:
- `types/semantic/index.ts`: stale `TraceNode` export
- `compiler/utils/Hash.ts`: missing Node `crypto` type declaration in current compile environment

## Next root
`TraceNode` export boundary.
