# Phase 1381 — Upstream Reasoning / Interface / Runtime Trace

## Scope
Trace the requested surfaces in the Phase 1380 source snapshot: `core/src/types/upstream`, AST/ADT and dataflow, operation identity, route capability/security, core runtime wiring, React/SDK/CLI consumers, `examples/ecommerce-shop-source`, manifest, graph, IR, and audit scripts.

## Architecture invariant
`Laravel/source evidence -> upstream semantic reasoning -> closed judgment/ADT -> contract interface -> wiring -> runtime executor -> IR/Graph/SDK/React/Next.js projection`.

A runtime consumer must not classify raw semantic evidence or complete an incomplete contract. `closed: true` is a type-level marker, not runtime validation by itself; completeness comes from required fields, authoritative construction, and end-to-end consumer wiring.

## Findings from source trace

### A. Operation identity
- `packages/core/src/types/upstream/operationIdentityCapability.ts` separates the closed result shape from the executable `OperationIdentityCapabilityRuntimeAlgebraInterface`.
- `packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts` composes the upstream authority by delegation.
- `packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts` is a real wiring/projection surface.
- Recommendation: keep this producer/contract separation; next audit should prove that every runtime identity consumer receives `OperationIdentityCapabilityContract` or its explicit projection, not route facts to reinterpret.

### B. Semantic dataflow
- `packages/core/src/types/upstream/semanticDataflow.ts` models typed identities, facts, derivations, paths, closure, authority, and a closed judgment.
- `packages/core/src/types/upstream/semanticDataflowAuthority.ts` owns fixed-point reachability/path closure and creates the judgment.
- `packages/core/src/types/upstream/astDataflowInterface.ts` aliases the canonical input/judgment and exposes the read-only `DataFlowAuthorityInterface` boundary.
- `packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts` and `packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts` are consumer-side adapter/projection surfaces.
- Risk to keep auditing: any analysis adapter that reconstructs seed/derive/close/judge is a second authority. A read-only consumer may query a judgment but must not regenerate it.

### C. AST / ADT
- `packages/core/src/types/upstream/astSemanticInterface.ts` defines the fact/rule/closure/judgment algebra and also implements fixed-point closure.
- `AstSemanticClosure.derivations` is currently returned as an empty array by `closeFacts`; this is a concrete proof-carrying gap: a `converged` closure does not itself explain which rules derived its facts.
- Recommendation: don't pretend an empty derivation list is proof. Either produce derivation witnesses from the same upstream rule application, or make the type distinguish a closure without derivation proof from a proof-carrying judgment. Do not let downstream synthesize missing proof.

### D. Route capability — change made in Phase 1381
- Prior contract exposed several positional operations (`crudRoleResolution(method, path, action?, explicit?`) alongside `crudRoleFromAction`, `crudRoleFromRoute`, and `capabilityEvidence`.
- The production boundary in `boundaryInputResolution.ts` called the positional resolver, leaving the authority input shape implicit across multiple arguments.
- Phase 1381 adds `RouteCapabilityCrudInput` as a tagged input ADT and makes `resolve(input)` the canonical authority operation. `RouteCrudRoleResolution` remains the closed result ADT. The existing positional API is retained as a deprecated compatibility projection.
- The production boundary now supplies one typed input object and receives the closed judgment. Classification implementation remains in the upstream authority.

### E. Route security
- Phase 1380 already routes the boundary security judgment into capability builder and resolver graph. Continue enforcing that middleware/auth are resolved once upstream and never passed to those consumers for a second interpretation.

### F. Framework/target surfaces
- `packages/react/src`, `packages/sdk/src`, `packages/cli/src`, and `examples/ecommerce-shop-source` are downstream/integration surfaces, not semantic authorities by default.
- Next.js, Zod, Axios, and TanStack Query belong to target projection and execution contracts. Their adapters should receive operation/route/schema contracts already resolved upstream; they should not infer Laravel semantics from endpoint strings or raw middleware.
- Manifest/Graph/IR should preserve canonical operation identity, evidence lineage, and judgment closure instead of recomputing them from partial route records.

## Audit result
Run:
`npm run audit:phase1381-route-capability-closed-contract`

The audit checks the new input ADT, closed result, canonical interface operation, real boundary wiring, compatibility marker, and public export. It is a structural source audit, not a substitute for a TypeScript build or runtime tests.

## Official references
- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — interfaces let analyses/transforms operate against semantic contracts rather than hard-coded per-operation implementations.
- TypeScript Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html — discriminated unions make semantic variants explicit and support exhaustive handling.
- TypeScript Generics: https://www.typescriptlang.org/docs/handbook/2/generics.html — generic contracts can preserve input/result relationships across layers.
- Laravel Middleware: https://laravel.com/docs/13.x/middleware — middleware is source evidence for route/security interpretation; its meaning should be resolved by the upstream model.
- TanStack Query TypeScript: https://tanstack.com/query/latest/docs/framework/react/typescript — a well-defined query function result enables type inference at the target-consumer layer.
