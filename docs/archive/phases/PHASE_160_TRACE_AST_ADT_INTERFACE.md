# Phase 160 — Trace AST/ADT Interface

## Trace
`ResourceQueryOperation` previously reconstructed the filter operand position from raw argument count inside `predicateFromArguments`:

`args.length >= 3 ? 2 : 1`

This made operand position a downstream interpretation of syntax shape.

## Semantic gap
A filter's meaning is not its raw argument indexes. The semantic contract is:

- property
- comparison operator
- operand

## Repair
Elevated the existing query operation domain model with `ResourceQueryFilterArguments` carrying the complete semantic filter contract. `predicateFromArguments` now constructs this semantic value and returns it directly as the predicate.

Operand position is resolved at the query-origin boundary through a typed `predicateOperandResolvers` registry for the supported 2-argument and 3-argument source shapes. The rest of the query pipeline consumes the completed semantic contract rather than inspecting argument positions.

## Result
Before:

`raw args -> argument count -> operand index -> predicate`

After:

`raw args -> boundary shape resolver -> ResourceQueryFilterArguments -> ResourceQueryPredicate`

Downstream no longer needs to infer which argument represents the operand.

## Validation
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reports only the existing environment blocker:

`packages/core/src/compiler/utils/Hash.ts(4,28): Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by Phase 160.

## Next trace target
`relationLoadTargets` still decodes colon/comma/dot encoded strings directly into relation path and property selection. That encoding is a source-shape concern and should be elevated into a typed relation-load argument model at the origin boundary so downstream never parses the encoded string again.
