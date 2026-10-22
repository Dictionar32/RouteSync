# Phase 1764 — Upstream Builtin Lookup Authority

## Scope

Interface-first continuation from Phase 1763. The PHP builtin catalog already owned the 94 source-name-to-ADT bindings, but its interface still exposed the raw binding array. The Laravel expression mapper performed the lookup itself, so semantic classification/search remained in scanner code.

## Changes

- `PhpBuiltinFunctionSemanticCatalogInterface` now exposes `lookup(FunctionName): Lookup<PhpBuiltinFunctionSemanticBinding>` rather than exposing the raw `bindings` collection.
- The upstream catalog privately owns the 94 bindings and the lookup relation.
- The resource expression mapper delegates lookup to the upstream catalog and only projects the closed `found` / `missing` result into existing `Expression` variants (`builtin` / `call`).
- The function identifier crosses the interface as the domain `FunctionName`, not a primitive `string`.
- The existing 94 mappings remain unchanged.

## Audit

Run:

```sh
node scripts/audits/phase1764-upstream-builtin-lookup-authority.mjs
node scripts/audits/phase1763-php-builtin-semantic-catalog.mjs
```

Expected results: Phase 1764 audit 17/17 and Phase 1763 audit 14/14. The Phase 1764 audit also verifies that invocation integrated response remains the canonical publication result and scanner still uses one composition boundary.

The audits are static source-contract checks. They do not establish TypeScript compilation or runtime test success.

## Remaining frontier

There are still 11 direct consumers of `mapResourcePhpAstToUpstream` outside the mapper. They are reported by the audit and must be migrated to the authority interface before the resource subscanner can be retired. This phase intentionally does not delete a still-used subscanner.

## References

- LLVM Flang semantic analysis: https://flang.llvm.org/docs/Semantics.html
- LLVM Flang compiler phases: https://flang.llvm.org/docs/Overview.html
- TypeScript discriminated unions: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html

> Superseded by Phase 1765. The exposed lookup API was retired in favor of a complete upstream semantic judgment; run `node scripts/audits/phase1765-php-function-call-semantic-authority.mjs` for the current contract audit.
