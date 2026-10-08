# Phase 145 — Data-flow elevation of syntax predicates

## Trace

The Phase 144 trace showed that the remaining problem was not the existence of `if`/`while` by itself. The problem was syntax/domain knowledge being encoded inside predicates and positional traversal.

The target architecture is:

`Tree-sitter / token source -> syntax facts -> syntax navigation/data model -> Laravel route facts -> semantic data flow -> AST/consumer`

Tree-sitter already exposes structured node types, fields, named/anonymous node information, and query predicates. Those are substrate capabilities; RouteSync should add a higher-level Laravel route model instead of copying Tree-sitter's representation upward unchanged.

Laravel routing is also declarative: route methods, parameter constraints, groups, middleware, and binding behavior are route facts that can be represented as data before semantic consumers interpret them.

## Implemented

1. **RoutePathTokenFact**
   - Replaced route-path policy functions with a catalog of `RoutePathTokenExpectation` values (`string` / `any`).
   - Added `routePathTokenFact()` carrying method, expectation, and actual syntax fact.
   - `isRoutePathToken()` is now only a compatibility projection of that data model.

2. **RouteInvocationFact**
   - Route-root and separator requirements are represented as named requirements in a fact object.
   - `routeInvocationMethod()` consumes the fact instead of owning the syntax definition.

3. **Delimiter boundary as data**
   - `DelimiterState` now carries `boundary: 'top_level' | 'nested'`.
   - Token traversal uses `isTopLevelDelimiter()` instead of embedding `delimiterDepth(state) === 0` in every traversal rule.

4. **Syntax scan decision as data**
   - `SyntaxScanStep` / `SyntaxScanState` already model continuation/stop.
   - The interpreter now treats the allowed continuation decisions as a set of data values instead of comparing the decision directly.

5. **Presence as data**
   - Route syntax model optionality paths were moved toward `Presence` dispatch rather than `undefined` equality checks.
   - Route binding extraction now uses the upstream `Presence` ADT.
   - Syntax navigation uses `fromOptional()` as its single optionality boundary.

## Remaining boundary

`while` loops in `TokenCursor` and `syntaxGrammar` are traversal interpreters. They are not themselves route knowledge. The next elevation should therefore move their *termination/match conditions* into reusable `SyntaxScanStep`/`SyntaxPattern` data, rather than mechanically replacing loops with another control-flow construct.

Likewise, generic `===`/`!==` used only for implementation mechanics (for example cursor identity or array-length bookkeeping) should not be confused with domain knowledge. Domain comparisons such as route method, delimiter kind, operation kind, route-group property, or syntax presence belong in catalogs/ADTs/facts.

## External architecture trace

Tree-sitter's official documentation describes node types as structured data and queries as patterns over syntax-tree nodes/fields; predicates are higher-level query metadata. This supports treating Tree-sitter as the syntax substrate rather than the final RouteSync semantic model.

Laravel's routing documentation documents route methods, constraints, route groups, middleware, and binding as route-level concepts. Those concepts are appropriate inputs to RouteSync's higher-level syntax/semantic data-flow model.
