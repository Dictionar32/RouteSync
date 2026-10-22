# Phase 2504 — Resource Assignment Provenance Through Existing Interface

## Trace and root cause

The Resource expression path already has an upstream named input contract, `ResourceAstExpressionMappingInput<SyntaxValue>`, carrying both the syntax value and canonical `SourceFile`. Its operation adapter delegates to the existing `resourceAstExpressionMappingAuthority`.

Two assignment-target projection call sites in `resourceProducer.ts` and `resourceBinder.ts` discarded that canonical object and recreated a `SourceFile` from the callback's path string. The recreated value is redundant and weakens provenance continuity at precisely the point where assignment target expressions are projected.

## Change

Both call sites now close over the already-established `SourceFile` and pass it to `mapResourceAstExpression({ value, sourceFile })`. The callback-specific `createSourceFile(file)` reconstruction was removed; other producer operations that intentionally construct a source identity from their own path input remain unchanged. No new interface, generic abstraction, or duplicate authority was introduced; the existing upstream operation contract remains the boundary.

## Verification

Run `node scripts/audits/audit-phase2504-resource-assignment-provenance-interface.cjs`. This audit checks the two call sites, absence of source-file recreation at those projection points, named source-bearing input, and adapter-to-authority wiring.

## Explicitly open

This is a provenance-continuity fix, not completion of the Laravel scanner retirement. The resource semantic authority, resource producer, resource binder, source-evidence lexer, property-path resolver, and controller response detector still import `semantic/relations`. Active controller/request/assignment subscanner dependencies also remain. No claim is made that `semantic/foundation` is transitively absent, or that full project typecheck, build, Vitest, or CLI E2E passed.
