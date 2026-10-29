# Phase 2887 — Fully Typed Runtime Scanner Operations

## Scope

This phase converts the exported semantic dataflow query-policy functions into interface-first runtime operation objects, migrates their in-repository call sites, and replaces the query-policy wildcard upstream barrel export with explicit value/type exports. It is a focused implementation slice, not a claim that every upstream runtime operation or every CLI manifest stage has been migrated.

## Runtime trace

`semanticDataflowManifestSurface` → `materializeSemanticDataflowQueryPolicy.materialize(judgment, intent)` → closed `SemanticDataflowQueryPolicyContract` → downstream validation/association through `validateSemanticDataflowQueryPolicyContract.validate`, `decodeSemanticDataflowQueryPolicyContract.decode`, and `semanticDataflowQueryPolicyMatches.matches` → stable fact identity through `semanticDataflowFactContractKey.key`.

Current consumers migrated:

- `packages/core/src/types/upstream/semanticDataflowManifestSurface.ts`
- `packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts`
- `packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts`

## Interface-first operations

The following exported runtime values now use explicit interface contracts and `Object.freeze({ ... })`:

- `semanticDataflowFactContractKey: SemanticDataflowFactContractKeyInterface` with `.key(fact)`
- `materializeSemanticDataflowQueryPolicy: SemanticDataflowQueryPolicyMaterializerInterface` with `.materialize(judgment, intent)`
- `validateSemanticDataflowQueryPolicyContract: SemanticDataflowQueryPolicyContractValidatorInterface` with `.validate(candidate, judgment)`
- `decodeSemanticDataflowQueryPolicyContract: SemanticDataflowQueryPolicyContractDecoderInterface` with `.decode(candidate, judgment)`
- `semanticDataflowQueryPolicyMatches: SemanticDataflowQueryPolicyContractMatcherInterface` with `.matches(candidate, judgment)`

No exported `function` declaration was added. Private implementation arrows remain private; consumers call the domain-named operation methods rather than bare exported functions.

## ADT/domain-operation boundary

`SemanticDataflowQueryPolicySelection` already exposes `continueWith` to consume default vs explicit selection without forcing callers to classify its `kind`. The materialized `SemanticDataflowQueryPolicyContract` remains a closed, serializable data contract intentionally: adding executable methods to that serialized shape would undermine JSON validation and decoding. Domain actions are therefore provided by explicit runtime operation objects around the contract, rather than injecting methods into the JSON payload.

## Barrel and collection constraints

`packages/core/src/types/upstream/index.ts` now explicitly exports the query-policy operation values and associated type contracts. `packages/core/src/types/upstream/collections.ts` remains empty (0 bytes).

## Audit result

The targeted Phase 2887 audit passes all six checks: empty collections file; no exported function declaration in the target policy module; interface-first operation declarations; explicit upstream barrel exports; migrated call sites; no old bare-call syntax in audited target/caller files.

## Validation limits

The full TypeScript check could not run in this extracted workspace because dependencies/type definitions are absent (`@types/node`, `vitest/globals`) and the globally installed TypeScript compiler is incompatible with this repository's configured target/lib values. Do not treat the targeted static audit as proof of a passing typecheck, build, unit suite, or CLI E2E. Those remain unverified.

## Next trace/suggestion

Continue from the CLI manifest composition authority and inspect the next concrete exported callable on the actual `CLI scan → manifestScanOperation.scan → controllerInvocationManifestCompositionAuthority.compose → source discovery/identity binding → invocation inventory judgment → manifest continuation → CLI projection/output` path. Before each migration, verify existing upstream contracts and all callers, then migrate the complete call-site set and test the real CLI fixture. Do not mass-convert every `map`, optional field, or `undefined` solely by textual pattern; first establish its domain meaning and whether an upstream ADT can own the operation without creating a generic helper/ADT.
