# Phase 3079 — Fully Explicit Typed Runtime Scanner Operations

## Objective

Audit the actual runtime path that constructs the upstream CLI manifest and feeds the generator. Raise domain knowledge into typed ADT operations; do not mechanically erase syntax or move domain decisions into generic control flow.

## Runtime trace (observed in the workspace)

```text
CLI scan / sync
  → routeSyncCliManifestScanOperationFactory
  → ControllerInvocationManifestCompositionAuthority.compose
  → requested SourceProjectIdentity
  → filesystem realpath canonicalization
  → source discovery inventory / discovery blocker judgment
  → discovered source files
  → discoveredSourceReadSettlementOperation.readAll
  → PhpSourceDocumentReadOperationSettlement
       ├─ fulfilled(read result)
       └─ rejected(source identity + normalized failure evidence)
  → PhpSourceDocumentReadOperationBatchFactory.fromSettlements
       ├─ fulfilled batch(reads in original order)
       └─ rejected batch(accumulated SourceFileInventory + ordered rejection evidence)
  → on fulfilled: source identity binding batch
  → PhpSourceDocumentReadBatchFactory.fromResults
       ├─ complete documents
       └─ blocked reads + partial documents
  → semantic invocation pipeline / inventory judgment
  → ManifestBuilderJudgment
  → manifest projection and validation
  → CLI generator output
```

The source-read rejection inventory migration is implemented at the upstream domain boundary: each rejected settlement contributes its source identity to the batch-owned `SourceFileInventory`; finalization no longer reconstructs that inventory with a post-hoc `reduce`. The rejected manifest terminal retains both the source inventory and ordered normalized rejection evidence.

## Interface-first usage already present on the runtime path

```ts
export interface PhpSourceDocumentReadOperationSettlementFactoryInterface {
  readonly kind: 'php_source_document_read_operation_settlement_factory';
  readonly fulfilled: (
    requestedSourceFile: SourceFile,
    result: PhpSourceDocumentReadResult,
  ) => Extract<PhpSourceDocumentReadOperationSettlement, {
    readonly kind: 'php_source_document_read_operation_fulfilled'
  }>;
  readonly rejected: (
    sourceFile: SourceFile,
    failure: PhpSourceDocumentReadFailureEvidence,
  ) => Extract<PhpSourceDocumentReadOperationSettlement, {
    readonly kind: 'php_source_document_read_operation_rejected'
  }>;
}

export const phpSourceDocumentReadOperationSettlementFactory:
  PhpSourceDocumentReadOperationSettlementFactoryInterface = Object.freeze({
    kind: 'php_source_document_read_operation_settlement_factory',
    fulfilled: (requestedSourceFile, result) => { /* evidence + contributeToBatch operation */ },
    rejected: (sourceFile, failure) => { /* evidence + contributeToBatch operation */ },
  });
```

The excerpt is schematic: the checked-in factory body and evidence fields remain authoritative. The desired conversion is not `export const name = (...) => ...`; it is a named interface contract and a frozen object whose members own domain operations.

## Audit findings and open frontiers

1. **Implemented:** rejection identity inventory is accumulated at the source-read batch boundary; the post-hoc rejection reduction is gone.
2. **Implemented:** fulfilled read order, rejection order, normalized failure evidence, and the existing blocked manifest terminal are retained.
3. **Interface-first:** the settlement and batch factories are exported typed objects, not exported function declarations.
4. **Still open:** `PhpSourceDocumentReadOperationBatchJudgment` exposes generic `continueWith<Result>` handlers. This keeps the core/CLI dependency direction valid, but it is not yet the user's desired domain-specific continuation.
5. **Still open:** batch traversal is ordered sequence-based and accumulator-backed. Replacing it requires a typed source-settlement cursor/sequence contract, not a mechanical removal of `index`, `+`, or arrays.
6. **Still open:** other runtime-path judgments also use generic continuations, including source-project query-policy selection and manifest-builder judgment. They must be migrated one domain at a time with their evidence and dependency boundaries preserved.
7. **Not claimed:** no global elimination of `string`, `number`, `boolean`, `null`, `undefined`, arrays, `map`, `if`, `===`, `as`, `void`, or visitors. Some are legitimate representation or TypeScript mechanics; each occurrence must be classified by ownership and reachability before changing it.
8. **Not run:** whole-workspace strict TypeScript, full test suite, and PHP → CLI → manifest → generator end-to-end execution. `node_modules` is not present in this extracted workspace.

## Recommended migration order

1. Replace the batch's generic continuation with a **source-read-owned, manifest-neutral domain contract**. Keep `core` independent of CLI terminal types; do not simply rename the generic visitor.
2. Model settlement traversal as a typed cursor/sequence operation owned by the source-read batch domain. Preserve order and empty-batch semantics.
3. Audit source-discovery blocker evidence at the filesystem adapter boundary; normalize host failure payloads before they enter upstream ADTs.
4. Trace query-policy and manifest-builder judgments independently; migrate only callables proven reachable from scan/sync.
5. After each migration rerun focused structural checks, strict TypeScript, relevant tests, then a real PHP fixture through CLI → manifest → generator.

## Guardrails

- Keep `packages/core/src/types/upstream/collections.ts` exactly one newline byte.
- Do not restore `packages/core/src/semantic/relations/relationMembership.ts`, `relationalSequence.ts`, or `semanticRelations.ts`, or kernel re-exports to them.
- Do not infer positional argument correspondence when evidence is unproven.
- Preserve source identity, provenance, diagnostic/rejection evidence, ordering, blocker terminals, and manifest evidence.
- Do not replace domain knowledge with `if`/`===` checks elsewhere; equally, do not remove parser/scanner control flow mechanically where it is needed to recognize syntax or build syntax evidence.

## External domain reference

Laravel's official controller documentation describes resource controllers, route-model binding, and scoped nested binding. PHP's official type-system documentation describes scalar and user-defined types, interfaces, enums, and union/intersection types. These support modeling Laravel/PHP evidence with explicit typed contracts; they do not justify deleting required runtime representation types.
