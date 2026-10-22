# Phase 1952 Interface-First Trace

```text
Canonical invocation reasoning contract
  └── rules.astProjection
        ├── syntaxOnlyContextKind
        └── semanticContextKind
                 │
                 ▼
LaravelControllerAstProjectionSemanticAuthorityInterface
  ├── reasoning: existing canonical rule
  └── judge(context) -> closed projection judgment ADT
                 │
                 ▼
laravelControllerAstProjectionSemanticAuthority
                 │
                 ▼
controllerBodyParser.ts
  ├── syntax_only_projection -> ControllerBodyAst syntax-only variant
  └── semantic_projection -> buildDataflow(exact invocation judgment)
```

## Boundary finding

The previous parser used the canonical rule's literal fields directly, which avoided duplicated literals but still made the parser interpret semantic context. Phase 1952 moves that decision behind an explicit authority interface. The interface cannot execute by itself in TypeScript; its authority implementation executes the rule and returns a closed judgment. The parser now executes the AST projection of that judgment rather than deciding from raw context evidence.

## Next trace

Trace the semantic projection's `ControllerDataflowSemanticJudgmentAuthority` result through `ControllerBodyAst`, controller scan artifact, inventory closure receipt, and CLI manifest builder. Verify the exact invocation judgment and integrated response survive the whole path without reconstruction or reclassification.
