# Phase 3069 — Integration Outcome to Controller Judgment Domain Operation

## Objective

Continue the upstream-first migration. The previous integration ADT still exposed `continueWith<Result>(handlers)`, so its consumer had to provide a generic result type and dispatch through four callbacks. This phase replaces that generic continuation with a domain-specific operation on each integration outcome.

## Runtime change

`PhpSourceInvocationSemanticPipelineIntegrationResult` outcomes now own:

`toControllerInvocationSemanticJudgment(sourceFile)`

The operation is implemented through the interface-first exported object `phpSourceInvocationSemanticPipelineIntegrationJudgmentOperations: PhpSourceInvocationSemanticPipelineIntegrationJudgmentOperationsInterface`, with four outcome-specific constructors (`notConnected`, `sourceBindingRejected`, `complete`, `blocked`) so the type correlation is not widened into one generic response.

The operation constructs the controller invocation judgment with:

- the exact original integration outcome retained as `response`;
- the source file associated with the controller invocation;
- canonical source-file identity relation semantics from `laravelSourceIdentitySemantics`;
- the existing controller invocation judgment contract version.

The four integrated outcomes (not connected, source-binding rejected, complete, blocked) install this operation. The consumer in `laravelControllerInvocationSemanticJudgmentAuthority.ts` now calls `response.toControllerInvocationSemanticJudgment(sourceFile)` instead of `response.continueWith(...)` and four generic handlers.

## Runtime trace

```text
PHP whole-file source
  -> frontend extraction and validation
  -> source inventory / name resolution
  -> closed invocation batch
  -> PHP source invocation pipeline judgment (complete | blocked)
  -> source-binding judgment (closed | rejected)
  -> pipeline composition evidence
  -> PhpSourceInvocationSemanticPipelineIntegrationResult
       ├─ not connected
       ├─ source binding rejected
       ├─ complete
       └─ blocked
  -> outcome-owned toControllerInvocationSemanticJudgment(sourceFile)
  -> LaravelControllerInvocationSemanticJudgmentInterface
  -> controller response semantic projection
  -> Laravel controller scanner
  -> source AST pipeline
  -> manifest builder (complete | blocked)
  -> CLI scan / sync output gate
  -> manifest / IR
```

The changed contract is on the upstream integration outcome. The CLI/manifest trace is included to preserve runtime context; this phase does not claim that a PHP fixture was executed end-to-end.

## Audit

Run:

```bash
npm run audit:phase3069-integration-to-controller-judgment-domain-operation
```

The audit checks the generic handler contract is absent from this integration ADT, all four outcomes install the domain operation, the operation preserves the exact response and canonical source identity relation, the consumer uses the operation, changed TypeScript files transpile without syntax diagnostics, and protected workspace invariants remain intact. It also runs Phase 3068 and Phase 3067 regression audits.

## Results

- Phase 3069 structural checks: **17/17 PASS**.
- Phase 3068 regression audit: **PASS**.
- Phase 3067 regression audit: **PASS**.
- TypeScript syntax transpilation of four changed files: **PASS**.
- Targeted strict TypeScript check: **BLOCKED** with 585 diagnostics across the dependency graph, including deleted relation-foundation imports, the protected one-byte `collections.ts` invariant, and ambient type/dependency gaps (`chai`, `deep-eql`, `estree`, and others). None of the four changed files appears in the diagnostic output, but this is not a successful project type-check.
- Vitest runtime: not run; workspace installation remains incomplete.
- PHP → CLI → manifest/IR end-to-end fixture: not run.

## Remaining upstream frontier

- `LaravelControllerInvocationSemanticInput` still has a generic `continueWith`; migrate it at the input/authority boundary next, without recreating generic dispatch under another name.
- Source-file identity relation judgments still expose generic continuation operations.
- This phase does not claim repository-wide removal of generic callbacks or primitive types/operators.
- No deleted relation foundation was restored. `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
