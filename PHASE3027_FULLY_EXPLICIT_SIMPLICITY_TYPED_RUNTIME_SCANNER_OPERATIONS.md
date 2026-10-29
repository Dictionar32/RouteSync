# Phase 3027 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Runtime trace

The manifest-producing path remains:

1. CLI manifest scan operation (`packages/cli/src/manifestScanOperationInterface.ts`).
2. `ControllerInvocationManifestCompositionAuthorityInterface.compose`.
3. Upstream source discovery, source document identity binding, invocation semantic pipeline, validation, and manifest preparation.
4. Manifest terminal judgment and its explicit continuation for downstream drift audit.

This phase follows the source-evidence operations used inside that path. It does not replace the runtime entrypoint or introduce another generic relation foundation.

## Implemented in this phase

- Added `SourceSpanOverlap`, a closed domain judgment for overlapping, disjoint, and invalid source spans.
- Added `sourceSpanOperations.overlaps`, which owns half-open interval overlap semantics and file identity checking.
- Migrated PHP function-resolution inventory region-overlap detection to the domain operation.
- Tightened source-span validation in the function-resolution environment projection to use the explicit non-empty validity judgment and canonical containment operation.
- Migrated source-span equality checks in request-type source-occurrence verification to `sourceSpanOperations.same`.
- Migrated effective controller-action policy source equality to `sourceSpanOperations.same`.
- Added overlap tests and exported the new judgment type through the core entrypoint.
- Added a repeatable Phase 3027 static audit.

## Why this is a domain migration, not a primitive wrapper

The work centralizes *meaning*—same source occurrence, non-empty source region, containment, and interval overlap—in upstream-owned operations. Consumers now ask the domain model for a judgment rather than independently repeating coordinate comparisons. The numeric offsets remain at the parser/serialization boundary for compatibility; this phase does not claim that primitive representation has been eliminated.

## Validation

Run:

```bash
npm run audit:phase3027-source-span-consumer-domain-migration
```

The static audit checks the migrated consumers, overlap test coverage, preservation of the one-newline `collections.ts` invariant, and absence of the deleted relation foundation modules. It does not replace a TypeScript build, Vitest run, or CLI-to-manifest integration test. Those are not claimed as passed in this workspace because dependencies are not installed.

## Remaining work

- Migrate remaining direct `SourceSpan` comparisons and direct span construction consumer by consumer.
- Give source positions dedicated domain representations and operations rather than leaving `NumberValue` as their representation.
- Continue tracing `StatementIndex`, names, truth/security judgments, and other primitive consumers from the real runtime path.
- Audit `undefined`, `null`, `boolean`, `reduce`, empty-array defaults, `??`, ternaries, and syntax-navigation arithmetic by domain ownership; do not mechanically remove parser-boundary primitives or AST dispatch.
- Keep deleted relation foundation modules absent and preserve source identity, provenance, evidence, type facts, and blockers through the upstream → CLI → manifest path.
