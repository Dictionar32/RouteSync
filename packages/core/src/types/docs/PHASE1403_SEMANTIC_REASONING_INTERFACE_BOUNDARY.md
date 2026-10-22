# Phase 1403 — Semantic Reasoning / Interface Boundary Trace

## Governing rule

RouteSync must settle semantic meaning once, upstream. The intended path is:

`Laravel source evidence -> source AST -> complete AST/ADT -> semantic relations and judgments -> closed capability contracts -> wiring/projection -> SDK/React runtime execution`.

An interface is not a semantic authority merely because it is typed. A useful contract must carry the already-resolved decision, its identity, its provenance/evidence, and explicit absence/ambiguity states where needed. A consumer should not re-run role selection, infer intent from method/path, invent query keys, or repair semantic identity.

## Trace observed in Phase 1402 workspace

- CLI `scan` and `sync` both call `manifestBuilder.build(sourceProject)`.
- `upstreamManifestBuilder.ts` calls `scanSourceAsts`, validates `CompleteSourceAst`, builds `CompleteLaravelSourceModel`, derives semantic dataflow inputs/judgments, and publishes AST, source model, dataflow, and resource-group capability surfaces in the manifest.
- Operation identity has an upstream capability/materializer path and downstream projection consumes the resolved identity reference.
- Resource-group shape is computed upstream, but `ResourceGroupCapabilityContract` currently carries only shape/evidence. It does not carry the final action/parameter slot references needed by the hook generator.
- `hookConfigLowerer.ts` still scans `group.all` for `crudRole`/`targetScope` to select CRUD slots. This is compile-time generator reasoning, not runtime reasoning, but it violates the stronger goal that generators be dumb projections of closed upstream contracts.
- React consumes `crudSlots` directly when present, but `groupSlotResolver.ts` retains a role-scanning fallback for hand-authored configurations without the contract. This is actual runtime semantic duplication.
- `sourceAstScanner.ts` still mixes source discovery/AST extraction with recursive statement traversal and semantic producer selection. Its role should be narrowed to source evidence and canonical AST production; semantic relation closure belongs in a separate upstream reasoning stage.
- CLI `routeGrouper.ts` still resolves duplicate action symbols by adding suffixes during projection. Stable action identity/uniqueness should be closed upstream and projected unchanged.
- Legacy descriptor APIs still contain role-based selection helpers. Their callers need to be traced before the compatibility surface can be retired.

## Required next architecture increment

1. Add a closed `ResourceGroupSlotCapability` ADT to upstream. Each CRUD slot is either an explicit route reference or an explicit absence; each reference carries canonical action identity and parameter capability reference. Custom endpoints are a typed collection, not re-discovered by scanning endpoint metadata.
2. Materialize that ADT from already-closed `RouteSemanticFlow` capabilities in the upstream relation algebra. Keep evidence/provenance and reject ambiguous duplicate slot assignments instead of silently selecting the first route.
3. Make the CLI hook generator serialize the ADT without `findRoute`, `filter(crudRole)`, or target-scope classification.
4. Migrate checked-in/example hand-authored configs to emit the same contract. Then make `HookConfig.crudSlots` required for the generated CRUD hook path and remove React role-scanning fallbacks.
5. Split `sourceAstScanner` into source evidence collection and AST canonicalization; move semantic traversal and relation closure into a distinct upstream reasoning interface. Do not delete scanner files solely based on names; trace imports/callers and empty only truly retired files.
6. Move duplicate action-name resolution upstream, so the downstream projection cannot mutate semantic identity.
7. Extend audits to assert end-to-end preservation: source evidence -> semantic judgment -> contract -> manifest/graph/IR -> generated SDK/React, including no type/data loss, no alternate ownership authority, and no runtime reclassification.

## Runtime boundary

Runtime may dispatch on a closed ADT discriminator, execute Axios requests, validate external payloads with Zod, and let TanStack Query cache/invalidate data. It must not infer CRUD role, operation identity, parameter ownership, mapper policy, or query-key semantics. Query-key construction must remain an explicit upstream/generated capability because TanStack Query requires keys to uniquely identify data and include variables that affect the query.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — interface-based transformations avoid per-operation special-case knowledge.
- CodeQL JavaScript/TypeScript data flow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/ — AST and dataflow nodes are distinct representations with different analytical roles.
- TanStack Query keys: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys — query keys must be unique to data and include relevant query variables.
- TypeScript 7 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — toolchain claims must be verified separately from semantic architecture audits.

## Validation note

The companion audit script is a boundary trace, not a claim that migration is complete. It passes only if the intended current boundaries still exist and reports the remaining migration frontier explicitly. A passing audit with residuals means the boundary is documented and testable, not that all residuals have been eliminated.
