# Phase Error Repair 17 — Trace Node Boundary

## Trace
The semantic trace canonical type is `SemanticTraceNode` in `types/domain/semanticResolution.ts`.
The semantic barrel and package root incorrectly exported a non-existent `TraceNode`.

## Root cause
This was a barrel/export naming mismatch, not missing upstream trace data. Creating another `TraceNode` ADT would duplicate the semantic model.

## Repair
- `types/semantic/index.ts`: export `SemanticTraceNode` from `../contract`.
- `types/index.ts` package root: export `SemanticTraceNode` instead of `TraceNode`.
- No duplicate `TraceNode` type was introduced.

## Verification
Targeted TypeScript check:
- `TraceNode` export diagnostic: resolved.
- Remaining diagnostic is isolated to `compiler/utils/Hash.ts` (`crypto` type declaration/environment boundary).

## Dataflow
Resolver → `SemanticTraceNode` → `SemanticResolution.trace` → semantic barrel → package root.

The semantic trace model remains single-source-of-truth.
