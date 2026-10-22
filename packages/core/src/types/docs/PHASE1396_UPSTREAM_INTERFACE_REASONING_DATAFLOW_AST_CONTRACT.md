# Phase 1396 — Upstream Interface, Reasoning, Dataflow, and AST Contract Trace

## Architectural decision

RouteSync treats parser/AST nodes as source evidence, not as a downstream semantic authority. Canonical semantic input facts and their lineage are created at the upstream boundary. `createSemanticDataflowJudgment` owns reasoning closure. The result crosses the analysis/runtime boundary as a closed judgment and proof contract. The read-only `DataFlowAuthorityInterface` and `AstDataflowInterface` expose that judgment without exposing the producer execution algebra.

```text
Laravel source / PHP AST
        |
        v
CompleteSourceAst + CompleteLaravelSourceModel
        |
        v
SemanticDataflowInput (closed ADT + producer lineage)
        |
        v
SemanticDataflowAuthority -> closed judgment + proof + fixed-point closure
        |
        +----> OperationIdentityCapability / SemanticCapability contracts
        |
        v
AstDataflowInterface / DataFlowAuthorityInterface
        |
        v
upstream wiring -> manifest projection -> graph / IR / SDK / React
```

## Phase 1396 source correction

`routeProducerRelations.ts` previously called `materializeOperationIdentityCapability` directly. It now calls `operationIdentityCapabilityFromRoute`, which routes the producer through `operationIdentityCapabilityAuthority`. The authority delegates to the injected `OperationIdentityCapabilityContractMaterializerInterface`; it does not classify route methods, rebuild identity, or mint a second reasoning proof.

## Audit maintenance

Some old audits still described earlier interface shapes (for example, expecting a dataflow adapter to call the judgment solver, or expecting a runtime-algebra `fromRoute` method). Those expectations conflicted with the current split between producer authority, pure projection adapter, and contract materializer. The audits were updated to check the current architecture rather than weakening checks or deleting them.

## Ownership invariants

- Upstream alone constructs semantic judgments and fixed-point closure.
- Operation identity materialization consumes already-resolved route identity/evidence.
- `AstDataflowInput` and `AstDataflowJudgment` are aliases of canonical semantic ADTs, not parallel shapes.
- Runtime projection forwards closed judgments; untrusted policy payloads are decoded at the execution boundary.
- Graph structural relations and semantic dataflow closure remain separate products.
- IR, CLI, SDK, and React project existing capabilities and do not classify method/path into operation meaning.
- The Laravel example is a fixture for source analysis, not a hard-coded production dependency.

## External technical references

- TypeScript 6.0 is documented as a transition release preparing for TypeScript 7.0's native compiler; removed/deprecated compiler options must be handled explicitly: <https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html>
- CodeQL distinguishes AST nodes from data-flow nodes and models flow through sources, sinks, edges, and barriers: <https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/
- MLIR interfaces allow generic transformations and analyses to operate without special-casing each operation or dialect: <https://mlir.llvm.org/docs/Interfaces/
- MLIR's IR has operations, values, blocks, regions, and types, with a representation designed for semantic transformations: <https://mlir.llvm.org/docs/LangRef/
- Laravel routes are source declarations handled by the routing subsystem: <https://api.laravel.com/docs/12.x/Illuminate/Routing/Router.html
- Next.js App Router uses file-system conventions for target routing: <https://nextjs.org/docs/app
- Zod runtime parsing validates data and derives static types; it is a validation boundary, not a replacement for upstream domain reasoning: <https://zod.dev/basics
- Axios request config expresses transport concerns such as URL, method, body, and response handling: <https://axios-http.com/docs/req_config
- TanStack Query query keys identify cached queries and must be stable/serializable: <https://tanstack.com/query/latest/docs/framework/query-keys

## Verification limits

The Phase 1396 audit is a static source-contract audit. The extracted workspace has no local `node_modules`; `tsdown` is unavailable. The globally available compiler is TypeScript 5.8.3, not the package-declared TypeScript 7.0.2, and the broad targeted type-check traverses unrelated existing scanner/request/AST errors. Therefore, this phase does not claim a successful full build or TypeScript 7 verification.
