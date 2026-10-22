# Phase 2240 — Request Evidence Projection Interface-First

## Ownership decision

The existing `LaravelControllerRequestSemanticBindingAuthorityInterface` remains the sole semantic authority for controller request-binding judgments. Phase 2240 does not create a competing authority or move request classification into the scanner wiring.

The existing upstream request-binding contract now also names the parser-specific evidence projection boundary as `LaravelControllerRequestBindingEvidenceProjectionInterface<TMethodEvidence, TFormRequestIndex>`. Its output is `LaravelControllerRequestBindingEvidence`; it cannot return a semantic request judgment. The production action judgment authority calls the existing `laravelControllerRequestSemanticBindingAuthority.judge(...)` after projecting evidence.

## Production trace

```text
CLI controller invocation composition
  -> invocation semantic pipeline / inventory authority
  -> LaravelControllerScanner
  -> action semantic judgment authority
      -> injected ControllerBodySemanticJudgmentAuthorityInterface.judge(...)
      -> injected request evidence projection interface.project(...)
      -> existing LaravelControllerRequestSemanticBindingAuthorityInterface.judge(...)
      -> legacy scanControllerAction(...)
          -> resolveControllerActionContract(...)
  -> one published action semantic judgment
  -> action runtime executor forwards that judgment
  -> LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse(...)
  -> AST / manifest projection
```

## Explicitly not closed

`scanControllerAction` and `resolveControllerActionContract` remain on the production derivation path. The request evidence projection is now an explicit typed boundary, but this does not retire the legacy action resolver. `body_source_ast` and `request_binding_compatibility_adapter` remain tracked obligations until the canonical action derivation no longer depends on the legacy projection path.

## Guardrails

- No `relation` or `foundation` dependency was added.
- No second request semantic authority was added.
- Integrated response ownership remains with `LaravelControllerResponseSemanticPipelineInterface`.
- The runtime executor forwards the completed judgment and does not classify semantic meaning.
- This phase ran structural audit scripts only; it did not run TypeScript typecheck, Vitest, or package build.
