# Phase2885 — Explicit Query Policy Selection

## Root cause
`SourceProjectIdentity.dataflowQueryPolicyIntent?` encoded two domain states (default policy and explicit policy) as an optional field. The CLI canonicalization and manifest surface then branched on `undefined`.

## Change
- Added the domain-specific `SemanticDataflowQueryPolicySelection` ADT with default and explicit states and `continueWith`.
- Added `semanticDataflowQueryPolicySelectionFactory` as an interface-first runtime export.
- Made `SourceProjectIdentity.queryPolicySelection` required; removed `dataflowQueryPolicyIntent?`.
- Updated canonicalization to continue through the selection ADT.
- Updated manifest policy materialization and the upstream manifest builder to accept the required selection rather than `Intent | undefined`.
- Updated SDK test project fixtures and exported the contract through upstream/core barrels.
- Kept `collections.ts` empty; no generic collection ADT was introduced.

## Runtime trace
`CLI source identity → SourceProjectIdentity.queryPolicySelection → continueWith(default|explicit) → canonical identity → semanticDataflowManifestSurface.queryPolicyContractsFromJudgments(selection) → manifest builder`.

## Verification boundary
The structural audit checks the new ADT, runtime export, removal of optional policy branching, barrel export, syntax parsing, and empty collections file. It does not establish full project typecheck, build, or end-to-end test success.

## Runtime export audit snapshot
In the scoped `packages/cli/src/parsers/php`, `packages/cli/src/manifestScanOperationInterface.ts`, `packages/core/src/types/upstream`, and `packages/core/src/compiler/scanner/wiring` source directories, the grep audit found zero top-level `export function` declarations but 186 exported callable `const` declarations without an explicit interface annotation. Those are remaining candidates for call-site-by-call-site review; Phase2885 does not claim that all 186 have been safely migrated.

## Usage example
```ts
const project = createLaravelSourceProjectIdentity.create(createSourceFile(rootPath));
const contracts = semanticDataflowManifestSurface.queryPolicyContractsFromJudgments(
  judgments,
  project.queryPolicySelection,
);
```
The explicit-policy path uses `createLaravelSourceProjectIdentity.createWithPolicy({ kind: 'laravel_source_project_identity_with_policy_input', sourceRoot, policyIntent })`. Consumers do not pass `undefined` to select a mode.
