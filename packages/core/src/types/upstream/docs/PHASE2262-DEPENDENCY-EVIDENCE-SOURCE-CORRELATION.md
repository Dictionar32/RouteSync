# Phase 2262 — Dependency Evidence Source Correlation

## Trace

The action resolver already receives the exact `SourceFile` correlated with the invocation. However, parameter attribute arguments were converted into expression evidence using the synthetic file label `<controller-parameter>`. That label could sever expression-level provenance from the source file that owns the controller method and its constructor parameters.

## Change

- Constructor and method dependency derivation now receive the existing branded `SourceFile`.
- The dependency semantic input composer passes that source identity into attribute-argument projection.
- The expression AST adapter reads the underlying file label from `SourceFile`; the synthetic placeholder is retired.
- The existing `ControllerDependencySemanticJudgmentAuthorityInterface` remains the semantic owner. No new dependency authority, foundation/relation layer, or subscanner was introduced.

## Boundary

This closes a source-provenance defect at the dependency evidence projection boundary. It does not retire `resolveControllerActionContract`, close the whole action semantic derivation, or remove the subscanner tree. The action contract still composes dependency judgments and other products as a compatibility projection.

## Verification

`scripts/audits/audit-phase2262-dependency-evidence-source-correlation.cjs` checks the source-correlation wiring statically. This phase does not claim a package build, TypeScript check, or Vitest run.
