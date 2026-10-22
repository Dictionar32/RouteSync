# Phase 1951 Interface-First Trace

```text
PHP whole-file pipeline evidence
  -> source-binding authority
  -> integrated-response authority
  -> canonical invocation judgment ADT (v2 value / v11 contract)
  -> Laravel controller scanner
  -> parseControllerDeclarationFromInvocationJudgment
  -> controller body AST projection rule from the canonical reasoning contract
  -> controller dataflow semantic judgment authority
  -> AST retaining exact invocation judgment and integrated response
```

## Trace finding

The controller body parser already preserved the judgment, but the syntax-only/semantic projection branch was hard-coded against the literal `syntax_only`. That left the AST projection policy described by the upstream semantic contract rather than consumed from it.

## Correction

Added `ast_projection_rule` to the existing invocation reasoning contract and made `controllerBodyParser.ts` dispatch using that rule. The rule states that `controller_body_semantic` means a judgment is present; it does not imply `complete`. The parser does not inspect the four integrated-response outcomes, and the existing dataflow authority receives the original judgment unchanged.

## Invariants

- `not_connected`, `source_binding_rejected`, `complete`, and `blocked` remain distinct ADT variants.
- No detached source identity or response field is added to the parser boundary.
- No invocation classification is added to the scanner.
- No duplicate authority or `semantic/foundation` layer is introduced.

The declarative reasoning value lives in `laravelControllerInvocationSemanticJudgmentInterface.ts`, alongside its type. Both the existing judgment authority and AST body parser consume that same exported value. This avoids making the parser depend on the authority singleton just to read projection policy.
