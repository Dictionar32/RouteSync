# Phase 184 — Trace Scanner → Relation Meaning → Conditional ADT

## Flow

ecommerce_shop PHP resource
→ LaravelSourceLexer / PhpAstValue
→ ResourceScanner
→ SemanticResourceBinder
→ model semantic surface
→ BoundRelationNode
→ BoundConditionalNode
→ ParsedResource
→ downstream

## Trace finding

`whenLoadedBinder` previously reconstructed relation meaning locally:

- target model from fallback relation name
- collection/single from a boolean
- semantic type from a second decision
- conditional presence from `isOptional: boolean`

This made the consumer interpret relation semantics again.

## Upstream repair

`BoundRelationNode` now carries its `semanticType` directly.

`BoundConditionalNode` no longer carries `isOptional: boolean`. It carries:

- `always_present`
- `present_when_loaded { relation }`
- `present_when_condition { condition }`

A closed matcher `matchBoundConditionalAvailability()` was added.

`Lookup<T>` now has a central `matchLookup()` algebra so scanner consumers do not convert lookup meaning into `undefined` or boolean tests.

`whenLoaded` scanner binding now consumes the verified `ModelSemanticRelation` directly. Cardinality is represented by an explicit shape vocabulary:

- `one → single`
- `many → collection`

The mapping is centralized at the scanner semantic boundary, not rediscovered downstream.

## Invariant

```text
PHP source
  ↓
PHP AST
  ↓
ModelSemanticRelation
  ↓
BoundRelationNode
  ├── targetModel
  ├── relationType
  ├── cardinality
  └── semanticType
  ↓
BoundConditionalNode
  └── availability meaning
  ↓
ParsedResource
  ↓
downstream reads meaning
```

## Verification

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: only the pre-existing environment blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript error was introduced by this phase.

## Next trace target

Trace `ResourceScanner`'s raw `PhpAstValue → ResourceFieldExpression` bridge. The scanner still has a second semantic path (`resourceAstExpressionMapper`) that can lose source-expression meaning before the upstream AST/ADT boundary. The next repair should elevate that bridge rather than adding downstream reconstruction.
