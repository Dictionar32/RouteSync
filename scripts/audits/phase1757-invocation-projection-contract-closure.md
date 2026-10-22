# Phase 1757 — Invocation Projection Contract Closure

## Scope

This phase continues interface-first work on the invocation semantic judgment and integrated response. It does not claim that Laravel subscanner retirement is complete.

## Trace finding

`ControllerDataflowAst` previously exposed `invocationSemanticAnalysis` as a detached `InvocationSemanticAnalysis` alongside `invocationSemanticIntegratedResponse`. Although the analyzer obtained the analysis from the upstream projection, the scanner-facing type discarded the projection's discriminant (`validated-integrated-response-analysis` versus `rejected-integrated-response-analysis`). That flattened the accepted/rejected publication state at the scanner boundary and permitted consumers to treat the analysis as independent from its publication outcome.

The invocation authority also used delimiter-concatenated strings for source and invocation shape identity. Delimiter-based serialization is not a sound structural identity encoding when source names and operation names can contain those delimiters.

## Changes

- `ControllerDataflowAst.invocationSemanticAnalysisProjection` now carries the upstream discriminated projection as the scanner-facing analysis contract.
- Removed the detached `invocationSemanticAnalysis` field; scanner consumers read `.invocationSemanticAnalysisProjection.analysis` and retain the projection's accepted/rejected discriminator.
- `controllerDataflowAnalyzer` returns the original projection object and the exact composition result. It does not reconstruct or classify publication state.
- Phase 104 scanner tests now assert that the projection references the exact response held by the composition result and preserve the judgment assertions through the correlated projection.
- Invocation/source identity keys now serialize structured tuples with `JSON.stringify` instead of joining fields with delimiters.

## Architectural result

`typed source knowledge → invocation authority → judgment/analysis → publication authority → integrated response → discriminated analysis projection → Laravel scanner`

The scanner is now less able to accidentally detach the analysis from the publication result. Semantic judgment ownership remains upstream.

## Remaining work

Subscanner retirement remains incomplete. A trace of `packages/core/src/compiler/scanner` still finds multiple production imports from `subscanners`, including resource-expression canonicalization, controller analysis, route/model/resource scanners, and source bundle producers. Those modules must be migrated through domain-owned contracts and all consumers traced before the subscanner directory can be removed. This phase intentionally does not pretend that moving one import or deleting a facade would complete that migration.

## Validation boundary

Static source checks verify the new scanner-facing projection field, absence of the old detached field in the relevant production files, exact response-reference assertions, and structural identity serialization. ZIP integrity is checked separately. Vitest, TypeScript typecheck, and build are not claimed as passing.
