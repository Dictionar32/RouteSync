# Phase 1512 — Declarative Query Rule Model

## Objective

Strengthen the existing upstream query semantic contract before migrating more scanner behavior. This phase does not introduce a parallel semantic interface and does not claim that all rule bodies are now declarative.

## Changes

- Added `QueryOperationSemanticRuleDeclaration` to the existing upstream query semantic interface. Each declaration carries the claimed rule identity, exact method vocabulary, typed evidence shape, semantic premises, constraints, conclusion family, and allowed terminal outcomes.
- Reworked the keyed query rule catalog so dispatch indexes `declaration.methods` and returns rule identity from `declaration.rule`; the selected executor supplies a judgment but cannot redefine which rule was selected.
- Kept the executor separate from its declaration. Argument validation and AST construction still live in evaluator functions and remain a known next-stage migration frontier.
- Preserved the scanner rule: `malformed` is terminal; only `not_applicable` can reach the legacy scanner catalog. This prevents malformed claimed evidence from being reclassified by fallback logic.
- Exported the declarative rule contract types from the core public entry point.

## Architectural boundary

`Source syntax → typed evidence → declared semantic rule → selected executor → rule-carrying judgment → scanner projection`.

This is an intermediate model upgrade, not the final generic semantic solver. The next model-level step is to make premises and constraints executable through a shared semantic kernel, then migrate evaluator-specific reasoning into those declarations before removing scanner fallback families.

## Verification

Run:

- `node scripts/audits/audit-phase1511-keyed-query-rule-dispatch.cjs`
- `node scripts/audits/audit-phase1512-declarative-query-rule-model.cjs`

A full build/typecheck was not claimed by this phase.
