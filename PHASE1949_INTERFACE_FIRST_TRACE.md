# Phase 1949 Interface-First Trace

```text
scan / sync / drift audit
          |
          v
buildManifestWithInvocationPipeline(sourceProject)
          |
          v
controllerInvocationManifestCompositionAuthority.compose(input)
          |
          +--> discover controller PHP files
          +--> create source documents
          +--> analyze each whole-file source once
          +--> existing invocation judgment authority
          +--> construct project-bound source inventory
          +--> existing inventory closure authority
                    |
                    +--> validated receipt --> manifestBuilder.build(receipt)
                    +--> rejected ledger  --> CLI error; no manifest projection
```

## Interface ownership

- `ControllerInvocationManifestCompositionReasoningContract`: declares the closed orchestration order, outcome policy, empty-source-set semantics, and no-reclassification boundary.
- `ControllerInvocationManifestCompositionAuthorityInterface`: typed CLI composition boundary.
- `laravelControllerInvocationSemanticJudgmentAuthority`: remains the sole invocation judgment authority.
- `laravelControllerInvocationSemanticJudgmentInventoryAuthority`: remains the sole inventory closure authority.
- `manifestBuilder`: accepts only the validated closure receipt.

## Decision

Do not move the semantic judgment or inventory rules into CLI. The CLI contract describes composition and enforces the order of existing authorities; it does not duplicate their reasoning.
