# Phase 2364 — Resource evidence contract

The existing `RouteDeclarationEvidence` now explicitly preserves the source-level resource action filter and the `shallow`, `scoped`, `creatable`, and `destroyable` modifier facts already present on `RouteDeclarationAst`.

The action filter is closed (`unfiltered | only | except`) so absence is not confused with an empty `only`/`except` list. These are source evidence facts, not a new semantic judgment. The semantic owner of route-family classification remains the existing method-judgment authority.

`routeProducerInputFromRouteBoundary` now creates the evidence projection once and uses its resource facts when forming the existing `RouteResourceRegistration`. This closes a gap in the evidence contract but does not yet remove all source-AST dependence from route construction or make the scanner a pure executor.
