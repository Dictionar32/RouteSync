# Phase 1347 — Upstream capability, dataflow, and consumer trace

## Trace result

This phase audits the current Phase 1346 source tree. It does not invent a second semantic model and does not refill historical empty files.

```text
Laravel route/controller/request/model/resource/schema evidence
  -> CompleteLaravelSourceModel + route semantic producer
  -> upstream SemanticReasoningContract / RouteCapabilityContract
  -> OperationIdentityCapabilityContract + SemanticDataflowJudgment
  -> OperationIdentityProjectionInterface / DataFlowWiringInterface
  -> manifest + graph / IR projections
  -> CLI SDK emitter + SDK endpoint/query-key contract
  -> React hooks + TanStack Query
```

The structural graph path is separate from dataflow closure:

```text
route/controller/model_relation/resource/schema evidence
  -> StructuralSemanticRelation
  -> GraphEdgeRelation
  -> ServiceGraph projection
```

## Ownership rules

- `operationIdentityCapability.ts` is type-only contract algebra. Runtime construction belongs to `operationIdentityCapabilityAuthority.ts`.
- Operation identity must be projected from the closed upstream capability; CLI/SDK/React must not recover it from method, path, action name, or a split string.
- `SemanticDataflowJudgment` owns closure and proof. `SemanticDataflowInterface` is a compatibility facade over that judgment; it is not a second solver.
- `DataFlowInterface<Input, State, Node>` is generic execution/query infrastructure. Downstream analysis/IR should receive the read-only authority/projection surface rather than execution methods.
- Scanner-local semantic knowledge is adapted only by `compiler/scanner/wiring/semanticDataflowInputAdapter.ts`. The old `scanner/upstream` path is intentionally empty and must not become a second adapter.
- HTTP method is transport evidence. `hookKind`, `actionName`, `schemaRole`, `payloadLocation`, and operation identity are separate closed semantic facts; a consumer must not infer one from another.
- Axios transports the request; Zod validates/maps schemas; TanStack Query consumes stable keys. None of these libraries should become RouteSync's semantic authority.

## Source trace observations

- The current source tree contains many zero-byte historical TypeScript files, including old SDK emitters and CLI resolver modules. This phase does not restore them without an import/reachability proof.
- `scripts/audit/routesync-architecture.cjs` had two failures because it expected legacy helper implementations in the now-empty action map and expected a comment in the empty historical dataflow adapter. The audit has been aligned with the source's retired-in-place state, while preserving the no-consumer condition.
- `semantic-ownership-coverage` and `semantic-interface-contract-phase1305` already pass. Those results verify source patterns, not the full TypeScript build.
- Phase 1346's declaration-only config sets `isolatedDeclarations: false`. This is a compatibility fallback for declaration generation, not a stronger contract. The root config remains `true`; restore a single strict declaration path after resolving missing TypeScript 7 native package / declaration inference issues and adding explicit export annotations.

## Recommended order of further work

1. Keep `isolatedDeclarations: true` as the target contract. Inventory exported declaration errors and add explicit return/object types in source; do not suppress them by widening semantic types.
2. Replace textual reachability checks with a source-backed import/reference graph for `operationIdentityCapability`, `DataFlowInterface`, manifest, graph, IR, SDK and React consumers. Mark each empty historical file as retired only after proving no live import or package export points to it.
3. Type SDK endpoint metadata at the boundary so consumers receive `OperationIdentityReference`, `hookKind`, `schemaRole`, and `payloadLocation` as closed fields rather than relying on casts or fallback classification.
4. Separate API transport output from semantic operation identity: query-key factories consume the stable identity reference and include only variables that actually change returned data.
5. Derive Laravel evidence from routes, controller signatures, Form Requests, Eloquent relations/models, API Resources and schema/migration evidence; preserve provenance and uncertainty when evidence is incomplete. Do not fill gaps with method/path heuristics downstream.
6. Keep `GraphEdgeRelation` structural and `SemanticDataflowJudgment` semantic. Do not merge the graph edge catalog with dataflow fact/closure types.
7. Test the generated SDK and React hook contracts against the actual ecommerce fixture, then run the user's local `npm run build`. Static audit success must not be reported as a build pass.

## External design references

- TypeScript `isolatedDeclarations`: explicit exported type annotations make declaration output independently generatable. <https://www.typescriptlang.org/tsconfig/isolatedDeclarations.html>
- tsdown declaration docs: declaration generation switches between isolated transform and TypeScript compiler paths; generator compatibility is a tooling concern, not semantic authority. <https://tsdown.dev/options/dts>
- Laravel routing docs: route method/URI, controller action, route groups, middleware and model binding are distinct source facts. <https://laravel.com/docs/13.x/routing>
- Next.js Route Handlers: target HTTP methods and route context are target-framework projections, not Laravel semantic authority. <https://nextjs.org/docs/app/api-reference/file-conventions/route>
- MLIR interfaces: generic passes should query contracts instead of hardcoding dialect-specific knowledge. <https://mlir.llvm.org/docs/Interfaces/>
- CodeQL dataflow: language-specific source/graph modeling is separated from shared flow reasoning and path validation. <https://github.com/github/codeql/blob/main/docs/ql-libraries/dataflow/dataflow.md>
- Zod: schema is the runtime validation source and inferred types are projections of schema definitions. <https://zod.dev/basics>
- Axios: response/transport envelope is separate from domain data. <https://axios-http.com/docs/res_schema>
- TanStack Query: keys uniquely identify data and include changing query dependencies; key construction should consume RouteSync's stable operation identity. <https://tanstack.com/query/latest/docs/framework/react/guides/query-keys>
