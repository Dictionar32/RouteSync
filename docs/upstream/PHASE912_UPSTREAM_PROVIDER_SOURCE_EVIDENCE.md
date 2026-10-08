# Phase 912 — Upstream Provider Source Evidence

`types/upstream/application.ts` no longer depends on compiler scanner AST types for provider source input.

The previous `ProviderSourceAst` contract imported `ControllerParameterAttributeAst`, `AstIdentifier`, and `ControllerMethodAst` from the scanner. It is now `ProviderSourceEvidence`, with neutral upstream contracts for provider attributes and methods.

Scanner parsing remains the producer. The scanner converts concrete controller/provider syntax into `ProviderSourceEvidence` before invoking the provider producer.

Boundary invariant:

`compiler scanner AST -> ProviderSourceEvidence -> provider semantic producer -> ProviderDefinition / ProviderAst`

Production `types/upstream` compiler/scanner imports are audited to zero.
