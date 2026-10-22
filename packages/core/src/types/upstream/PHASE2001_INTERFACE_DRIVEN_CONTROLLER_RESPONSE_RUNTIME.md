# Phase 2001 — Interface-Driven Controller Response Runtime

## Root defect traced

Phase 2000 tightened the declaration-source correlation input but still left the concrete scanner disconnected from `LaravelControllerResponseSemanticPipelineInterface`. The scanner built a controller artifact without `responseJudgment`, and the artifact contract did not preserve the AST projection judgment. The response contract therefore described a pipeline that production code did not execute.

## Implementation

- Added `laravelControllerResponseSemanticPipeline.ts` under `types/upstream`. It composes the existing `LaravelSourceIdentitySemanticsInterface`, response evidence production, evidence source-binding, response judgment/runtime execution, and AST projection authority. It is not a scanner or subscanner and imports no `semantic/relations` or `semantic/foundation` modules.
- Implemented declaration-source correlation by asking the existing source-identity authority to compare the exact invocation source and declaration source. A different-source result is terminal and is retained as `controller_response_declaration_source_correlation_rejected`.
- Implemented response evidence production from source-owned controller method evidence. A descriptor-derived response reference remains tagged as `controller_action_response_reference_candidate` with its descriptor origin; it is not represented as direct PHP `return` evidence.
- Implemented per-item source binding through the existing source-identity semantics.
- Implemented the response runtime executor as a delegation to the response semantic authority. Since the current producer only has descriptor-derived candidates and no direct PHP return proof, the default authority returns a blocked `response_contract_unresolved` judgment rather than inventing a complete response product.
- Wired `laravelControllerScanner.ts` to execute correlation → evidence production → source binding → response executor → AST projection, and added both `responseJudgment` and `projectionJudgment` to each artifact ADT member.
- Aligned the concrete scanner and scan judgment contract versions at `22`; exported the upstream pipeline.
- Corrected stale branded-string access in the scanner declaration AST projection (`AstIdentifier` is a branded string, not an object with `.value`), fixed the descriptor type import path, and removed an accidental Sequence/array mismatch in action-method selection.

## Invariants

1. The existing invocation judgment remains the invocation authority; no second invocation authority was added.
2. Source identity is decided only by `LaravelSourceIdentitySemanticsInterface`.
3. Rejected declaration correlation cannot enter evidence production.
4. Descriptor provenance cannot be promoted into a PHP return proof.
5. The response executor only delegates to the response authority.
6. The AST projection authority receives the same invocation judgment and the resulting response ADT.
7. No new relation/foundation subscanner was added.

## Verification

- Static phase audit: 15 checks; result recorded in `PHASE2001_AUDIT.json`.
- TypeScript transpile syntax checks: performed on changed TypeScript files.
- A targeted TypeScript 5.8.3 project-graph check emitted no diagnostics in the three changed runtime/interface files, but the overall command remains nonzero with 1,178 diagnostics across the transitive code graph. This is not a successful full typecheck, and the repository targets a newer TypeScript/ES2025 toolchain than the available compiler.
- Full build and test suite were not run.

## Remaining boundary

The response pipeline is now executed by the scanner, but response semantics intentionally remain blocked when only descriptor-derived response candidates exist. A later phase should introduce source-backed PHP return evidence into the existing evidence model and then evolve the existing authority to close a product only when that stronger evidence supports it. Do not add a parallel subscanner or treat this conservative block as a finished response inference implementation.
