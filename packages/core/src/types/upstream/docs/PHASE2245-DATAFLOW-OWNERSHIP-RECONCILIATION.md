# Phase 2245 — Dataflow Ownership Reconciliation

## Findings

The Phase 2244 snapshot contained a duplicated `dependencySemanticJudgmentAuthority` property in `ControllerActionContractResolverContext`. The duplicate declaration was removed. This is a source-level correction; TypeScript compilation was not run in this environment.

The CLI-to-action path still reaches `resolveControllerActionContract`, which calls `createControllerDataflowContract` from `compiler/scanner/subscanners/controller/controllerDataflowContract.ts`. That module imports `semantic/relations` and combines several distinct concerns:

- traversing PHP expression AST nodes to discover nested resource candidates;
- projecting AST details into `ControllerResourceBindingCandidate` evidence;
- calling the existing `controllerResourceBindingAuthority.judge(...)`;
- projecting resolved judgments into the `ControllerResourceBinding` domain value;
- building the semantic variable index used to resolve model-origin evidence.

The existing `ControllerResourceBindingAuthorityInterface` already owns resource semantic judgment and canonical publication. A second resource authority is not warranted. The unresolved boundary is the AST/source-evidence projection and traversal that prepares its candidates.

## Contract change

`LaravelControllerActionDerivationOwnershipObligation` now includes `legacy_dataflow_resource_projection`, naming `createControllerDataflowContract` as the current owner and the existing resource-binding authority plus a source-evidence projection boundary as the target. Action contract and production wiring are both version 40. Action coverage remains partial.

The duplicate property correction and explicit obligation prevent the contract from claiming a cleaner state than the actual source path provides.

## CLI trace

```text
CLI composition
  -> invocation semantic pipeline
  -> LaravelControllerScanner
  -> action semantic judgment authority
  -> resolveControllerActionContract
  -> createControllerDataflowContract [subscanner + relation dependency remains]
  -> existing ControllerResourceBindingAuthorityInterface.judge
  -> published action judgment
  -> LaravelControllerActionExecutionInterface.execute
  -> LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse
  -> AST / manifest projection
```

Invocation correlation, integrated response ownership, and the judgment-forwarding runtime executor remain unchanged.

## Explicit non-claims

- This phase does not retire `controllerDataflowContract.ts`.
- This phase does not remove all `semantic/relations` imports from the Laravel scanner's transitive path.
- This phase does not claim TypeScript typecheck, Vitest, or build success.
- The structural audits do not substitute for compiler verification.

## Structural verification

Run from repository root:

```sh
node scripts/audits/test-phase2245-dataflow-ownership-reconciliation.cjs
node scripts/audits/test-phase2244-controller-dependency-semantic-ownership.cjs
```
