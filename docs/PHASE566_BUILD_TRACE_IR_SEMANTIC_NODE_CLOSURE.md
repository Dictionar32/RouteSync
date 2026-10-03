# Phase 566 — Build Trace IR SemanticNode Closure

## Trace

Latest build log reports a parser failure at `packages/core/src/ir/buildIRNode.ts:52` (`Unexpected "}"`) and DTS errors because `SemanticNode` is not structurally assignable to `SemanticResolution` and direct property access is performed on the whole discriminated union.

Evidence: `build(2).log` lines 32–52, 97–107.

## Repair

1. `computeStableHash` now delegates semantic-kind dispatch to a dedicated `matchSemanticNode` relation visitor instead of relying on branch-local narrowing through `relationGate`.
2. `matchSemanticNode` was added to the semantic-node type boundary using `relationRefine` + `relationOptionFold`, preserving explicit ADT narrowing while keeping semantic dispatch relational.
3. The malformed nested relation expression in `buildIRNode.ts` was replaced with a balanced visitor expression.
4. Object/query-projection field canonicalization remains relation-backed through `relationProject`.

## Verification

`typescript.transpileModule` reports zero diagnostics for both modified TypeScript files.

A full `npm run build` was not executed in the extracted checkpoint because it has no installed `node_modules`; the uploaded build log remains the authoritative pre-repair build trace.
