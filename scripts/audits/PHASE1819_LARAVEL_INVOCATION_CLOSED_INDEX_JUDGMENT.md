# Phase 1819 — Laravel invocation closed index judgment

## Trace

`CLI whole-file documents -> PHP invocation pipeline batch -> source-bound result index authority -> ControllerScanner lookup judgment -> source-binding authority -> controller declaration/method/body parser -> integrated response`

## Interface-first change

The source result index no longer exposes its collection representation. `PhpSourceInvocationSemanticPipelineResultIndex` exposes `lookup(SourceFile)` and returns a closed judgment union: `found`, `missing`, or `ambiguous`. `undefined` is not a semantic outcome. The concrete collection is private to the index factory.

`ControllerScanner` exhaustively projects each lookup judgment. Missing remains `not_connected`; found is passed to the source-binding authority; duplicate source identities are retained as a distinct `ambiguous` evidence and integrated-response outcome instead of silently selecting the first result.

## Why

A domain type alone was not enough while the public index still exposed `entries` and lookup returned an optional pipeline result. This phase moves the contract from data-container shape to an explicit lookup judgment authority. The source path still has a string representation at the filesystem boundary, but callers no longer key the invocation pipeline contract with `string` or a generic `RelationIndex`.

## Verification boundary

The phase audit checks source-level interface shape and exhaustive evidence projection. It is not a TypeScript build or end-to-end runtime test. No build/typecheck was run.
