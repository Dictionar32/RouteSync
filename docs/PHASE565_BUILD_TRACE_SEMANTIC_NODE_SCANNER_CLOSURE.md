# Phase 565 — Build Trace: SemanticNode + Scanner Closure

## Build evidence

The latest `npm run build` reached successful ESM/CJS output for core, sdk, react, and cli, but DTS failed in `buildIRNode.ts`. The same build also emitted repeated warnings for a missing `schemaProducer` export and stale closure export names.

## Root causes

1. `SemanticNode` used a non-distributive `Omit<SemanticResolution, 'fields'>`, so the union lost its discriminated branch shape and could not be consumed as `SemanticResolution`.
2. `buildIRNode.ts` passed `SemanticNode` into `matchSemanticResolution`, but `SemanticNode.fields` is the canonical `SemanticFieldSet`, while object/projection resolution branches use different field representations.
3. `schemaProducer.ts` contained relation-backed schema construction helpers but did not publish the `schemaProducer` value consumed by `sourceAstScanner.ts`.
4. `resourceAstExpressionMapper.ts` referenced stale dynamic export names (`mapClosureAssignment`, `mapClosureForAssignment`) while the canonical closure module exports `resolveClosureAssignment` and `resolveClosureForAssignment`.

## Repairs

- Made `SemanticNode` a distributive semantic-resolution variant while retaining the canonical `SemanticFieldSet`.
- Made `computeStableHash` dispatch directly over the semantic-node discriminant using relation gates and relation projection; no host `map` was introduced.
- Added the canonical `schemaProducer` relation-backed producer object.
- Redirected stale closure references to the existing canonical exported functions.

## Verification

All modified TypeScript sources pass `typescript.transpileModule` with zero diagnostics. Full `npm run build` cannot be executed in the checkpoint because `node_modules` is intentionally absent; the user's uploaded build log remains the authoritative external build result.
