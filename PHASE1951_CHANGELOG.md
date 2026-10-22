# Phase 1951 — AST Projection Reasoning Interface First

## Purpose

Close the gap between the canonical Laravel invocation judgment contract and the AST body projection boundary. The scanner must not interpret an invocation outcome; it must preserve the exact upstream judgment and integrated-response ADT.

## Changes

- Advanced `LaravelControllerInvocationSemanticJudgmentContract` from v10 to v11.
- Advanced the existing reasoning contract from v1 to v2 and added the `ast_projection_rule` ADT variant.
- The rule explicitly says that a semantic AST means a canonical judgment is present, not that invocation integration succeeded.
- The existing controller body parser now dispatches syntax-only vs semantic projection using the AST projection rule on the existing upstream reasoning contract.
- The parser forwards the exact `context.judgment` to the existing controller dataflow authority. It does not inspect or reclassify the integrated response outcome.
- Aligned the judgment value's `contractVersion` from 1 to 2 in the ADT and the existing authority's four construction branches.
- Updated regression audits that assert the current canonical invocation judgment contract version.

## Ownership

No new authority was introduced. The existing invocation judgment authority remains the interpreter of the reasoning contract; the scanner remains a syntax/evidence projection layer; controller dataflow authority retains semantic judgment ownership.
- Moved the canonical `LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_REASONING_CONTRACT` value into the existing judgment interface module so the interface owns both the reasoning type and the declarative rule value. The authority imports that value, and the AST parser imports the same value directly from the interface module; the scanner does not import the authority singleton merely to obtain policy.
