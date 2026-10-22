# Phase 2508 — Laravel Scanner Upstream Interface Trace

## Status

**Audit complete; implementation is intentionally not marked complete.** This pass does not edit `compiler/scanner/subscanners/`: that directory is a retirement target, so changing it would deepen the wrong ownership boundary. The current source tree has real upstream contracts, but several active implementations still route through the retiring directory and semantic relation/foundation modules. A wrapper or file move alone would not repair that root cause.

## Trace: active composition path

`LaravelSourceAstPipelineDependenciesInterface`
→ `compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts`
→ `LaravelFormRequestScannerInterface`
→ `upstreamFormRequestScanner.scan(input)`
→ `FormRequestScanner.scanCanonicalBundle(input.sourceProject)`
→ `compiler/scanner/subscanners/FormRequestScanner.ts`
→ `subscanners/requestProducer.ts` and `semantic/relations/*`
→ `LaravelFormRequestScanJudgment`.

The interface is wired, but the authority/implementation is not upstream-owned. The adapter in the composition root only reshapes the bundle; it does not remove semantic work from the retiring scanner.

## Findings

1. **Upstream contract exists, but ownership is incomplete.** `types/upstream/laravelFormRequestScannerInterface.ts` defines a closed scanner interface and judgment/artifact. Its active implementation still delegates to `FormRequestScanner` in `subscanners`.
2. **Request producer contract leaks compiler implementation types.** `types/upstream/requestProducerInterface.ts` imports `PhpArrayEntry`, `PhpAstValue`, `PhpMethodAst`, and `PhpClassPropertyAst` from `compiler/scanner/lexer`, and `TypeInterner` from `compiler/types`. This reverses the intended dependency direction for an upstream-owned contract.
3. **Active pipeline still imports retiring subscanners.** `laravelSourceAstPipelineDependencies.ts` imports FormRequest, response, schema, migration, DTO inventory, query, service, middleware, and provider implementations from `subscanners`.
4. **Semantic relation dependency remains in active semantic producer.** `compiler/semantic/sourceAstSemanticProducer.ts` directly imports `semantic/relations` and makes that dependency active. Moving this implementation to another file would not solve ownership.
5. **Foundation/relation are not closed out.** A source scan over `packages/core/src/compiler/scanner` and `packages/core/src/types/upstream` found 109 files with direct `semantic/foundation` imports and 362 with direct `semantic/relations` imports. These are repository counts from `rg -l`, not proof of transitive import closure; they demonstrate that global removal cannot truthfully be claimed by this pass.

## Root cause

The migration has elevated interface names without completing the implementation and datum ownership migration. The composition root binds contracts to legacy implementations, and some supposedly upstream contracts expose compiler-owned syntax/interner types. As a result, runtime/wiring still depends on retiring subscanners and semantic relations. An `export const name: ExistingInterface = ...` annotation alone does not fix this if the value delegates to the legacy implementation.

## Required repair order

1. **Close the datum contract first:** define/reuse upstream-owned source-evidence and closed request-production ADTs; remove compiler lexer and `TypeInterner` imports from `RequestProducerInput` by reusing existing upstream vocabulary where it exists. Do not add a parallel duplicate interface.
2. **Move semantic authority to its real owner:** validation-rule interpretation, authorization judgment, request AST and definition correlation must be produced by an upstream-owned operation contract. The operation must receive typed source evidence and return a closed judgment; it must not require the caller/runtime to reinterpret partial data.
3. **Rewire the composition root:** make `laravelSourceAstPipelineDependencies.ts` consume the upstream implementation directly. No wrapper around `FormRequestScanner`, no runtime semantic fallback, no relation/foundation dependency on this path.
4. **Repeat the same trace for every active subscanner import** (response/schema/migration/DTO/query/service/middleware/provider). Retire each implementation only after all consumers use the upstream boundary; do not modify the retirement-target directory as the fix.
5. **Prove closure:** audit direct and transitive imports, compile the core package, run relevant tests, and exercise CLI manifest generation against a fixture containing FormRequest validation and authorization. A syntax-only check is insufficient.

## Verification limits

- Inspected the active wiring and upstream request contracts directly.
- Counted direct import-bearing files using `rg -l`.
- Did not run a full TypeScript build, Vitest, package build, or CLI end-to-end test in this pass.
- No source implementation fix is claimed. This report is an evidence-based blocker trace to prevent another superficial phase from being represented as completion.

## External references

- TypeScript interfaces are intended to name structural contracts; the implementation must actually conform to the contract: https://www.typescriptlang.org/docs/handbook/interfaces
- Closed discriminated unions can represent alternatives explicitly, but the producer must provide the correct tagged value rather than make downstream code infer it: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Laravel's routing documentation demonstrates that Laravel source conventions are concrete framework semantics; RouteSync's scanner must preserve those semantics as source evidence and judgments, not infer them in a downstream generator: https://laravel.com/framework/docs/13.x/routing
