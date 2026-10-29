# RouteSync Phase2511 — Request Producer Evidence Ownership

## Scope

This phase closes one specific upstream ownership defect found in Phase2510: `types/upstream/requestProducerInterface.ts` directly imported PHP parser AST types from `compiler/frontend/php`. That reversed the dependency direction between the upstream contract and its concrete frontend evidence.

## Changes

- Removed compiler/parser imports from `requestProducerInterface.ts`.
- Parameterized the existing `RequestProducerInput` and `RequestProducerInterface` by the three concrete evidence types they consume: rules evidence, method evidence, and property evidence. This preserves the existing operation and result contract instead of introducing a duplicate interface.
- Bound those evidence parameters at the active operation boundary in `compiler/scanner/operations/requestProducer.ts` with the actual PHP parser types.
- Applied the same type-only specialization to the legacy producer declaration so the existing retired path remains type-consistent while consumers are being cut over. No semantic behavior in the legacy producer was changed.
- Added `scripts/audits/audit-phase2511-request-producer-evidence-ownership.cjs`.

## Verification

The focused audit checks that the upstream contract has no compiler imports, evidence types are parameterized rather than owned upstream, the active producer binds them at the implementation boundary, and the active scanner remains interface-first outside `subscanners`.

## Explicitly unresolved

- `requestAstCanonical.ts` and `operations/form-request/*` still import `semantic/relations` directly.
- `TypeHasher.ts` still imports `semantic/relations`; TypeInterner's transitive dependency closure is not relation-free.
- The Laravel pipeline still uses legacy subscanners for response, schema, migration, DTO, query, service, middleware, and provider.
- Full typecheck, package build, Vitest, and CLI end-to-end were not verified.

This phase does not claim that the entire Laravel scanner is relation/foundation-free or that all subscanners can now be deleted.

## TypeScript check status

A focused TypeScript 5.8.3 invocation was attempted against the active scanner and producer plus their imported graph. It could not serve as a project validation: the repository targets TypeScript 7 options unsupported by the available 5.8.3 compiler, and dependency compilation surfaced existing diagnostics in unrelated parser/semantic modules. The active producer and upstream contract had no diagnostics in that output; the active scanner had missing Node declarations (`path`, `node:fs`). No package build, Vitest run, or CLI end-to-end test is claimed.
