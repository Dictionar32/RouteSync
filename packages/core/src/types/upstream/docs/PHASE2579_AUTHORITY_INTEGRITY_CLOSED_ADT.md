# Phase 2579 — Authority Integrity Closed ADT

## Root cause

The upstream authority assessment validator used a recursive `unknown` comparator to compare policy contracts and a `Record<string, string>` plus `Reflect.get` to map decision rule identifiers to reasons. This erased the closed contract's discriminated-union guarantees at a boundary that is part of the active semantic pipeline. The assembler already requires reasoning, verifier, decision, and authority to share the exact same canonical contract object; coverage is created from that same object. Structural recursive equality therefore weakened the existing identity contract and permitted arbitrary runtime shapes to enter a comparison that should be closed by the upstream types.

## Change

- Replaced the recursive `unknown` comparison with canonical contract object identity. This matches the assembler's reference-identity contract and the coverage operation's use of the same contract value.
- Replaced the string-keyed reason lookup with an exhaustive switch over the authority-inconsistent decision ADT.
- Preserved existing assessment outcomes and their judgment/verification/coverage checks.
- Added `audit:phase2579-authority-integrity-closed-adt` and a focused structural/syntax audit.

## Active path

`CLI scan/sync -> injected semantic pipeline -> reasoning -> proof verifier -> coverage -> decision -> authority -> assessment integrity validator -> manifest projection`.

This change strengthens the integrity validator used by the existing assembler. It does not implement semantic reasoning and does not claim that all RequestType derivation laws are verified by a production verifier.

## Validation boundary

The focused audit verifies the closed rule mapping, identity-based contract correlation, removal of `unknown`/`Record`/`Reflect.get`, and TypeScript syntax transpilation. Full package typecheck, build, Vitest, and CLI end-to-end must be run separately.

## Type-check attempt

A targeted `tsc --noEmit --skipLibCheck --target ES2024 --module NodeNext --moduleResolution NodeNext` run was attempted on the changed validator. The repository-wide import graph still fails on existing type errors in unrelated domain/resource-model and upstream files. After correcting the two diagnostics initially exposed in the changed validator, the compiler output no longer reports diagnostics for `requestTypeDerivationAssessmentIntegrityRuntime.ts`; this is not a successful full typecheck.
