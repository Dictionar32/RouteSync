# Phase 638 — Unused Surface Vacuum

## Scope

This phase continues evidence-based dead-surface vacuuming after Phase 637.
No source file is deleted. Unused implementation surfaces are preserved as
zero-byte paths so the repository topology remains stable.

## Vacuumed surface

- `packages/sdk/test-resolve-reviews.ts`

Reason: standalone local debugging/review script with a machine-specific
absolute manifest path; no package export, script, test, or source reference
was found for the file. It was not part of the active SDK runtime or compiler
pipeline.

Result: **0 bytes**.

## Verification

- Exact repository reference search for `test-resolve-reviews` returned no
  references.
- The file remains present and is not deleted.
- Total zero-byte TypeScript files after this phase: 63.

## Semantic-authority rule

This vacuum does not mechanically remove source-language evidence such as
Laravel/PHP `null`, `??`, ternary, route method `any`, or target TypeScript
syntax. Those are handled as source/target dialect vocabulary. The continuing
architectural target is:

source evidence -> relations -> constraints -> recursive closure/fixpoint
-> witness/provenance -> declarative rewrite -> canonical Route IR
-> target dialect lowering.

## Research basis

MLIR's canonicalization infrastructure repeatedly applies rewrite patterns
until a fixpoint (or a configured limit), and its declarative rewrite rules
separate the semantic rewrite specification from host-language boilerplate.
K similarly models executable semantics with configurations and rewrite rules.
