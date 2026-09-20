# Phase 189 — Trace Match Arm Semantic Interface

## Flow

ecommerce_shop → PHP scanner AST → ResourceScanner upstream bridge → Expression ADT → semantic/domain downstream

## Finding
`PhpMatchArm` already distinguished `conditional` and `default`, but upstream `MatchArm` collapsed both into one shape. The canonical bridge encoded `default` as `conditions: []`, forcing downstream consumers to infer that an empty condition list means `default`.

## Repair
Raised the existing upstream `MatchArm` vocabulary instead of creating a parallel interface:

- `conditional { conditions, result, source }`
- `default { result, source }`

The scanner bridge now preserves the lexer meaning directly through `matchPhpMatchArm`.

## Before

PhpMatchArm.default
→ MatchArm { conditions: [], result }
→ downstream must infer `[]` means default

## After

PhpMatchArm.default
→ MatchArm { kind: 'default', result }

PhpMatchArm.conditional
→ MatchArm { kind: 'conditional', conditions, result }

## Invariant
No semantic absence is encoded as an empty collection. No downstream re-classification is required to recover match-default semantics.

## Verification
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reaches only the pre-existing blocker:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript error was introduced by this phase.
