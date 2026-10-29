# Phase 2817 — Route Path Explicit ADT / Relation-Free Acceptance Audit

## Root cause

Phase 2816 moved acceptance policy onto `RoutePathTokenFact`, but its `string` branch still called the generic `relationOptionFold` and `relationContains` helpers. That contradicted the requirement to remove generic relation utilities from this runtime path: the domain continuation existed, but its implementation still delegated the actual decision to generic relation machinery.

## Change applied

- Added the route-path-local closed `RoutePathTokenActual` ADT: `string`, `other`, or `none`.
- Build actual evidence directly from `TokenCursor.currentPresence` and the token's lexical type. The route-path acceptance path no longer calls `tokenSyntaxFact` to manufacture a generic relation-option value.
- `RoutePathTokenFact.continueForAcceptance` remains the domain operation that owns the expectation-specific continuation.
- The acceptance operation uses the direct domain match `actual.kind === 'string'`; its `string` branch no longer calls `relationOptionFold` or `relationContains`.
- `routePathTokenAcceptanceOperation` remains `export const name: Interface = Object.freeze({...})`; the parser consumes that operation.
- No generic replacement wrapper, new reasoning primitive, or duplicate upstream contract was added.
- `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## CLI → manifest runtime trace

```text
packages/cli/src/commands/scan.ts / sync.ts
  -> composition.manifestScanOperation.scan(input)
  -> controller invocation manifest composition
  -> upstream manifest builder / LaravelSourceAstPipelineInterface.execute()
  -> Laravel route scanner and route declaration parser
  -> findPathCursor(...)
  -> routePathTokenAcceptanceOperation.accepts(cursor, method)
  -> routePathTokenFactFactory.create(cursor, method)
  -> RoutePathTokenFact.continueForAcceptance(...)
  -> route declaration AST / RouteSyntaxSemanticJudgment
  -> RouteSyntaxSemanticFact.continueForProofRelation(...)
  -> semantic route projection
  -> manifest projection, validation, serialization and persistence
```

The Phase 2817 edit is limited to the route-path acceptance slice of that trace. It does not claim end-to-end CLI verification.

## Existing-contract-first / upstream recommendation

- The existing `RouteSyntaxSemanticFact` and `RouteSyntaxSemanticJudgment` contracts are already consumed by `routeSyntaxSemanticInterface.ts`; Phase 2815 established domain-operated proof continuation on each fact variant. Reuse those contracts rather than introduce a second route-syntax judgment.
- `RoutePathTokenActual` is lexical evidence local to the route parser. No evidence was found in this audit that it is independently consumed outside this parser/fact boundary, so promoting it to `packages/core/src/types/upstream` now would create an unnecessary parallel public contract. Keep it local unless a concrete upstream consumer/ownership gap is demonstrated.
- The broader module `semanticRouteSyntaxRelations.ts` still uses generic relation utilities in other route syntax responsibilities (for example catalog lookup and route-constraint/group extraction). This phase removes them only from the route-path acceptance operation; it does **not** claim global removal. Those remaining call sites must be migrated one by one to existing domain ADTs/direct typed operations before any shared relation helper or facade is deleted.
- `syntaxValue.ts` also still exposes relation-option-backed token facts and generic membership helpers; this remains a separate migration surface. Do not replace it with a generic wrapper.

## Interface-first usage example

```ts
const accepted: boolean = routePathTokenAcceptanceOperation.accepts(cursor, method);

const fact: RoutePathTokenFact = routePathTokenFactFactory.create(cursor, method);
const result = fact.continueForAcceptance({
  string: actual => actual.kind === 'string',
  any: () => true,
});
```

The ADT distinguishes absence (`none`), a lexical string token (`string`), and any other token kind (`other`). The expectation policy is applied by the fact's domain continuation; no generic relation fold or membership operation is involved in this acceptance slice.

## Verification performed

- `npm run audit:phase2817-route-path-explicit-adt-no-relations`: 10/10 checks passed.
- `npm run audit:phase2816-route-path-acceptance-operation`: 14/14 checks passed.
- `npm run audit:phase2815-route-syntax-domain-operated-judgment`: 10/10 checks passed.
- `npm run audit:phase2814-interface-first-php-scanner-runtime`: 7/7 checks passed.
- TypeScript syntax-only transpilation is recorded separately for the two changed TypeScript source files.
- Full typecheck, production build, full test suite, and CLI `scan`/`sync` E2E were not run by this phase.
