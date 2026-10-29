# Phase 3058 — Typed Source Production Input

## Intent

Remove raw path and optional provenance parameters from the primary PHP semantic producer contract. The producer receives one required domain input containing the PHP block, canonical `SourceFile` identity, and explicit `SemanticEvidenceProvider`.

## Runtime contract

`packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts`

- `PhpAstSemanticKnowledgeDataFlowProductionInput` requires `block`, `sourceFile`, and `evidenceProvider`.
- `PhpAstSemanticKnowledgeDataFlowProductionOperationInterface.produceWithOutcome` consumes that object and returns `produced | blocked`.
- The primary `semanticKnowledgeDataFlowProducer` exposes only the typed `produceWithOutcome(input)` operation.
- `semanticSource.createForFile` accepts a typed source-file identity and provider, so producer internals do not reconstruct source identity from a positional path string.
- The older graph-only convenience is isolated under `legacySemanticKnowledgeDataFlowProducer`; it remains for existing parser tests and is not the primary runtime contract.

## Example of intended usage

```typescript
const input: PhpAstSemanticKnowledgeDataFlowProductionInput = {
  block,
  sourceFile: invocationJudgment.sourceFile,
  evidenceProvider: { code: 'parser' },
};

const outcome = semanticKnowledgeDataFlowProducer.produceWithOutcome(input);
```

The result remains a closed `produced | blocked` ADT. A caller that needs to continue the runtime pipeline must preserve the blocked outcome rather than coercing it to an empty graph or throwing it away.

## Runtime trace

The CLI manifest entry remains:

`routeSyncCliManifestScanOperationFactory.create(authority).scan(input)` → `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)` → source discovery/read and identity binding → semantic judgment preparation → inventory closure → manifest judgment → CLI terminal outcome.

The PHP semantic producer is injected into the controller-variable semantic runtime via `phpAstSemanticKnowledgeEvidenceAdapter`. The adapter now calls the typed input contract, but its legacy projection contract still returns graph-only knowledge and can throw on blocked production. Preserving `produced | blocked` all the way through the controller analyzer and CLI manifest is **not completed in this phase**.

## Audit status

- Phase 3058 structural audit: 11/11 passed.
- Phase 3057 regression audit: 10/10 passed.
- `package.json` parses.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
- Deleted relation foundation modules remain absent; none were restored.
- Strict TypeScript dependency-closure check: blocked by 773 existing diagnostics, including imports of deleted `packages/core/src/semantic/relations/*` modules and the intentionally empty `collections.ts`. The edited producer files are therefore not claimed build-clean.
- Vitest/E2E CLI → manifest was not run because this workspace does not have a local Vitest executable and the dependency closure is currently broken.

## Next work

1. Change the upstream `SemanticKnowledgeEvidenceProjection` from graph-only knowledge to a typed outcome-bearing projection.
2. Update the controller analyzer and semantic judgment authority to consume `produced | blocked` explicitly.
3. Carry the exact source identity, evidence provider, fact identity, provenance, violations, and blocker through the manifest boundary.
4. Migrate the remaining imports from deleted relation foundations by domain ownership; do not restore those modules or replace them with a generic foundation.
5. Run strict TypeScript and end-to-end CLI → manifest after the dependency closure is repaired.
