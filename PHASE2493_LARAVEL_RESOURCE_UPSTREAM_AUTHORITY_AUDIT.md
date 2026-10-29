# Phase2493 — Laravel Resource Upstream Authority Audit & Trace

## Baseline

This checkpoint starts from `RouteSync-Phase2489-Resource-Orphan-Relation-Resolver-Retirement.zip`. It does not use Phase2490's producer-file relocation as the baseline.

## Executive result

**Not yet interface-first at the semantic authority boundary.** The producer object is syntactically declared through an upstream interface, but its implementation in `compiler/scanner/subscanners/resourceProducer.ts` still decides Resource semantics. Typing a function-bearing object with an interface is not equivalent to moving semantic judgment upstream.

The canonical scanner wiring in `compiler/scanner/wiring/laravelResourceScanner.ts` imports `../subscanners/resourceProducer` and binds it to `ResourceProducerInterface`. The legacy binder imports the same producer and directly calls `produceField`. The dependency is therefore shared, not isolated to one scan path.

## Trace of semantic ownership

1. `compiler/frontend/php/resourceSourceEvidence.ts` collects and constructs syntax/evidence. It still imports `semantic/relations` helpers.
2. `types/upstream/laravelResourceScannerInterface.ts` already defines `LaravelResourceSourceEvidence`, `ResourceSourceEvidenceScannerInterface`, `LaravelResourceScannerInterface`, and closed resolved/rejected scan outcomes. These contracts cover source evidence and model binding, **not the full Resource field/framework semantic judgment**.
3. `types/upstream/resourceProducerInterface.ts` defines `ResourceProducerInput`, `ResourceFieldProducerInput`, `ResourceProducerResult`, `ResourceFieldProductionOperationInterface`, and `ResourceProducerInterface`. The producer input still contains raw PHP syntax types at the scanner boundary and does not carry a completed semantic judgment.
4. `compiler/scanner/subscanners/resourceProducer.ts` classifies keyed entries, base-class representation, framework features, method presence, fields, operations, and properties. This is semantic reasoning in the producer implementation.
5. `compiler/scanner/subscanners/resource/resourceFieldProducer.ts` derives `property_projection`, `relation_projection`, `computed_projection`, field type, and output kind from PHP AST and model bindings.
6. `compiler/scanner/subscanners/resource/resourceAstExpressionMapper.ts` builds both domain-specific Resource expression semantics and the upstream PHP-AST expression projection. It is not merely a dumb AST serializer.
7. `compiler/scanner/binders/resource/resourceBinder.ts` directly depends on the same producer and retains its own `semantic/relations` dependency.

## Open dependency frontier

The following production files import `semantic/relations`:

- `packages/core/src/compiler/scanner/subscanners/resourceProducer.ts`
- `packages/core/src/compiler/scanner/subscanners/resource/resourceFieldProducer.ts`
- `packages/core/src/compiler/scanner/subscanners/resource/resourceAstExpressionMapper.ts`
- `packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts`
- `packages/core/src/compiler/frontend/php/resourceSourceEvidence.ts`

The target files do not show `semantic/foundation` imports in this baseline search, but that does **not** prove the broader scanner is foundation-free. The complete import graph must be audited after each cutover.

## Root cause

There is a contract gap between the existing closed model-binding judgment and the Resource semantic output. Upstream resolves which model a Resource belongs to, but downstream producer code still decides what the Resource means. `ResourceDefinition` and `ResourceField` are closed output ADTs, but the source-to-ADT semantic judgment that authoritatively determines those values is not yet a separate upstream-owned contract.

## Recommended correction sequence

### P0 — Evolve existing contracts, do not duplicate them

Extend the existing `ResourceProducerInterface` family only after reviewing the existing Resource ADTs. The target contract should consume a complete, source-correlated Resource semantic judgment rather than raw PHP `entries`, `methods`, `properties`, and base-class strings as the source of semantic decisions. Do not add `ResourceProducerInterfaceV2` or a second competing authority.

The judgment should preserve explicit variants for:

- Resource representation and wrapping;
- field meaning and output;
- field presence and type;
- operations and dynamic entries;
- framework / collection / JSON:API capabilities;
- method/property presence or absence;
- unsupported or ambiguous source forms with provenance.

Use existing ADTs in `types/upstream/resource.ts` where sufficient. Add a new ADT only for a missing semantic concept, with one clear owner.

### P1 — Establish a typed upstream authority operation

Introduce the authority operation at the correct upstream owner, with evidence as input and a closed Resource judgment as output. Keep PHP parser/lexer types at the compiler boundary: the upstream contract must not import from `compiler/frontend/php` or `compiler/scanner/subscanners`.

Do not merely relocate the current producer implementation into `types/upstream`; that would preserve the same coupling and only disguise the ownership problem.

### P1 — Reduce producer to projection

The producer should accept only the closed judgment plus projection inputs and construct `ResourceDefinition` / `ResourceAst`. It must not decide field semantics, inspect method names to infer capabilities, classify base classes, repair incomplete judgments, or use fallback semantic classification.

Reuse `PhpAstExpressionSemanticAuthorityInterface` for generic PHP AST projection where its contract is sufficient. Keep Resource-specific semantic judgment upstream rather than duplicating it in the mapper.

### P2 — Wire every consumer before retiring legacy paths

Update the canonical `laravelResourceScanner.ts` path and `resourceBinder.ts` together. Trace every import/callsite of `produceField` and `produceResult`. Only remove the `subscanners` implementation after no production consumer depends on it and tests prove parity.

### P3 — Remove relation/foundation dependencies by ownership, not helper substitution

For each `relation*` use, classify whether it is:

- syntax/evidence traversal;
- semantic classification;
- closed judgment folding;
- plain collection projection.

Move semantic decisions into the upstream authority. For syntax traversal, use the project's existing parser/AST algebra where possible. Do not replace imports with home-grown helpers that leave the same semantic reasoning in the scanner. Audit `semantic/foundation` separately across the full production import graph.

## Verification required before declaring complete

- Contract tests prove all Resource semantic decisions are present in the upstream judgment.
- Producer tests prove it only projects and preserves provenance.
- Regression tests cover scalar fields, model properties, relations, computed expressions, nested arrays, resource single/collection calls, conditional fields, collection features, JSON:API, and unsupported forms.
- Import audit proves the canonical scanner and binder no longer import `semantic/relations`, `semantic/foundation`, or retired `subscanners` modules on the migrated path.
- Typecheck, focused Vitest, package build, and CLI end-to-end are all run and their exact results recorded.

## Status and honesty boundary

This phase is an audit/trace artifact, not a source-code implementation phase. No claim is made that the five dependency paths are fixed. The safe next implementation unit is the upstream Resource semantic judgment contract plus its authority operation, then wiring both canonical and binder consumers. Performing a file move or adding another interface without changing semantic ownership would be a false fix.
