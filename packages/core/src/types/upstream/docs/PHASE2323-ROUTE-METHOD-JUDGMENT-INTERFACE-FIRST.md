# Phase 2323 — Route Method Judgment, Interface First

## Finding
`laravelRouteScanner.ts` previously called `routeDeclarationSemanticKind` and cast `declaration.method as ResourceRouteMethod` in the same runtime path that emitted routes. The scanner therefore both decided the semantic category and executed the decision, while the type assertion concealed the missing contract relationship.

## Contract-first change
- `laravelRouteScannerInterface.ts` now owns the canonical `LaravelRouteMethod` vocabulary.
- `LaravelRouteDeclarationMethodJudgment` is a closed ADT: resource methods and standard methods have separate narrowed payloads.
- `LaravelRouteDeclarationMethodJudgmentAuthority` defines the upstream authority contract.
- `LaravelRouteScannerInterface` explicitly exposes `declarationMethodAuthority`, making the dependency visible in the wiring contract.
- `laravelRouteDeclarationMethodSemanticAuthority.ts` implements the authority.
- The route AST imports/re-exports the upstream method vocabulary instead of maintaining a duplicate union.
- `laravelRouteScanner.ts` dispatches on the judgment ADT and passes the narrowed resource method to resource expansion without `as ResourceRouteMethod`.

## Validation
Run `node scripts/audits/audit-phase2323-route-method-judgment-interface-first.cjs` and the route source/resource audits. This is a structural contract audit; it does not replace a full TypeScript project typecheck or CLI integration test.

## Remaining work
The scanner still contains route acquisition, response/authorization derivation, relation-based helpers, and controller-target adaptation. This phase does not claim the entire scanner is a pure runtime executor or that `semantic/relations` has been removed from implementation files. The next migration must transfer one complete semantic responsibility at a time to an existing upstream authority contract and keep the CLI path consuming its closed result.
