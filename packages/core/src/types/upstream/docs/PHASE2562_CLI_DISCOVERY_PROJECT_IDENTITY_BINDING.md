# Phase 2562 — CLI Discovery Project Identity Binding

## Root cause

The CLI manifest composition accepted a `LaravelControllerSourceDiscoveryResult` but built `LaravelControllerSourceInventoryInterface.sourceProject` from the requested `ControllerInvocationManifestCompositionInput.sourceProject`. That erased the discovery result's own `sourceProject` claim before the canonical inventory authority could compare identities. A faulty or substituted discovery implementation could therefore return sources attributed to another project while the composition silently relabeled them as the requested project.

## Change

- Preserve `discovery.sourceProject` as the inventory subject identity.
- Preserve the originally requested `sourceProject` on the inventory completeness witness.
- Let the existing upstream `LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface.close` and its canonical source-project identity semantics produce the mismatch judgment. The CLI does not compare identities, repair the discovery result, or invent a second identity authority.
- Type the composition operation against the existing `ControllerInvocationManifestCompositionAuthorityInterface['compose']` contract.
- Evolve the existing composition reasoning contract to version 7 and state the discovery-to-requested-project identity binding step.

## Active path after the change

`requested SourceProjectIdentity -> source discovery judgment -> discovery.sourceProject retained as inventory subject -> requested identity retained as completeness witness -> upstream inventory identity judgment -> validated/rejected inventory ADT -> manifest builder operation -> ManifestBuilderJudgment -> CLI AST/IR projection`

## Scope and limits

This closes the project-identity erasure gap at the CLI-to-upstream inventory boundary. It does not claim that the CLI has a complete production request-type semantic pipeline; that pipeline must still be injected by a host and the active command deliberately fails closed if it is absent. It also does not claim a full typecheck, package build, Vitest run, or end-to-end CLI scan/sync.
