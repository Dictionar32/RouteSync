# Phase 1556 — Interface-First Source Identity Contract

## Purpose

Strengthen the semantic interface model itself. This phase does not move runtime functions to new files and does not add a second semantic solver.

## Trace

`packages/core/src/types/upstream/semanticTypeDerivationInterface.ts`
- Before: proof coverage was represented by aggregate resource/model/route counts. Two different source inventories with equal counts were indistinguishable at the contract boundary.
- After: `SemanticTypeSourceIdentity` and `semanticTypeSourceEvidence(request)` define a deterministic, typed inventory of the exact source identities admitted to derivation. The proof carries this inventory.
- Runtime contract validation compares the proof inventory with the request inventory, in addition to checking stage receipts and result accounting.

`packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationAuthority.ts`
- The authority constructs the source inventory from the original request and includes it in the proof.
- Semantic derivation remains in the existing authority and existing derivation algebra. No new solver was introduced.

`packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts`
- Remains a `const`-backed executable function value that delegates to the authority and enforces the upstream contract. It does not derive semantic types itself.

## Scanner frontier (not claimed as complete)

- `compiler/scanner/subscanners/RequestTypeDeriver.ts` still orchestrates `createDerivationContext` and `aggregateRequestTypeGroups`.
- `compiler/scanner/subscanners/request-deriver/groupAggregator.ts` remains an aggregation/reasoning frontier requiring ownership review.
- `compiler/frontend/php/astClassifierRuntime.ts` still contains classifier runtime behavior; syntax classification must be distinguished from domain-semantic inference rule by rule.
- `compiler/scanner/wiring/routeManifestTypeLowering.ts` still directly invokes `RequestTypeDeriver.derive`.

These are explicitly recorded as remaining migration work. This phase does not claim that all scanner semantic reasoning has moved upstream.

## Verification

- Static contract audit: checks that the proof interface includes exact source identities, the authority populates them, and the executor validates the contract.
- TypeScript build: not verified. The available global TypeScript compiler is 5.8.3 while this workspace targets TypeScript 7.0.2 / ES2025 and requires local `node` and `vitest` type definitions, which are absent.
- Vitest: not run because local dependencies are absent.

## Architectural basis

MLIR's official interface documentation motivates interfaces as generic semantic contracts that decouple analyses/transforms from concrete implementations: https://mlir.llvm.org/docs/Interfaces/ . TypeScript's handbook explains that annotations are erased from emitted JavaScript, so runtime contract enforcement cannot rely on the interface declaration alone: https://www.typescriptlang.org/docs/handbook/2/basic-types.html .
