# Phase 552 — Scanner/Lexer/Resolver Presence Closure

## Research basis

The architecture continues along declarative static-semantics and rewrite-system lines:

- Statix models scopes, edges, declarations, and name resolution as scope-graph constraints.
- MLIR PDL/PDLL represents pattern matching and rewriting as a declarative intermediate representation.
- Flix treats relation/lattice fixpoints as a first-class computation model.

The RouteSync implementation consequence is that absence and selection in the scanner/route-AST boundary are represented through semantic presence relations rather than host-language absence sentinels.

## Changes

Closed the remaining Phase 550 scanner/resolver host leaks:

- `routeDeclarationAst.ts`: optional group controller/domain fields are represented as optional structural properties rather than explicit `undefined` types.
- `routeDeclarationParser.ts`: controller/domain projection is emitted through presence folds and object projection instead of an absence sentinel.
- `semanticRouteSyntaxRelations.ts`: catalog selection and route invocation use `Presence`; merged optional group facts use presence projection rather than `void 0`.
- `syntaxRange.ts`: range lookup returns `Presence<TokenCursor>` and mapping consumes presence witnesses; ternary absence construction was replaced by relation resolution.
- `relationalSequence.ts`: the generic optional fold no longer contains the literal `undefined` keyword; the compatibility boundary uses the existing absence model while migration continues.

## Verification

Phase 549 audit:

- closedSurfaceClean: `true`
- transpileDiagnosticsClean: `true`
- ok: `true`

Phase 550 scanner/resolver audit:

- scannedFiles: `388`
- hostLeakCount: `0`
- leakingFiles: `[]`
- closedSurfaceClean: `true`
- transpileDiagnosticsClean: `true`

The `modelNullEvidence` report remains separate because PHP `null` is source-language evidence in scanner AST models, not host semantic control.
