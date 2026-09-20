# Phase 188 — Trace Assignment Receiver Interface

## Trace

ecommerce_shop → Laravel scanner lexer → PhpAssignmentTarget → upstream AssignmentTarget → semantic/domain consumers

## Finding
`PhpAssignmentTarget.property` previously carried `PhpPropertyPath`. That path retained only root/property names and therefore could lose the actual receiver AST and its access semantics (`->` versus `?->`) before upstream translation.

The upstream `AssignmentTarget.property` already had the correct semantic shape (`receiver + name`), but the scanner boundary was reconstructing `receiver` from a reduced path.

## Repair
The existing scanner ADT was raised instead of creating a parallel interface:

- `PhpAssignmentTarget.property.target` → `receiver: PhpAstValue`
- assignment classification now forwards `member.receiver`
- upstream mapping now calls `mapExpression(target.receiver, file)` directly
- legacy path reconstruction helpers were removed
- resource-domain assignment mapping now also consumes the real receiver expression

## Result

```text
PHP member AST
  ↓
PhpAssignmentTarget.property
  ├── receiver: PhpAstValue
  └── property: AstIdentifier
  ↓
AssignmentTarget.property
  ├── receiver: Expression
  └── name: PropertyName
```

The downstream layer no longer needs to reconstruct property receiver meaning from names/path arrays.

## Invariant
The origin boundary preserves the receiver expression once. Consumers receive semantic receiver data instead of inferring it through path reconstruction.

## Verification
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` produces only the pre-existing blocker:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by Phase 188.

## Next trace
Check array/index assignment and member/method chains for the same pattern: if a scanner ADT already contains the real expression receiver, no downstream path reconstruction should remain.
