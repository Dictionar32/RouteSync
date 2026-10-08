# Phase 803 — Route Group Constraint Upstream Frontier

## Build frontier

The local build reached `routeDeclarationParser.ts:112` because route-group constraint state used a parser-local `RouteGroupConstraintFact` whose `parameter` was `string`, while the consumer had already been raised to the branded `RouteConstraintParameterAst` boundary.

The correction is not a cast or string conversion at the failing line. The group-constraint semantic state is now owned by `core/types/upstream` and carries the complete typed Laravel route-constraint evidence.

## Model elevation

`types/upstream/routeGroupFacts.ts` now defines `RouteGroupConstraintFact` with:

- `RouteParameterName` instead of free `string`.
- `RouteConstraintSyntaxMethod`.
- `RouteConstraintArgument` closed ADT.
- explicit `{ kind: 'group' }` provenance.

The lexer semantic state imports that upstream type rather than defining a duplicate local ADT.

## Trace

`Laravel route token evidence`
→ `RouteConstraintSyntaxFact`
→ `RouteGroupConstraintFact` in `core/types/upstream`
→ `RouteGroupStateModel`
→ `RouteDeclarationAst` projection
→ `RouteGroupFact` adapter
→ `routeGroupSemanticResolver`
→ `RouteConstraint` semantic context.

The AST boundary converts upstream typed values back into AST brands only at the AST projection edge; semantic state itself does not carry free parameter strings.

## Loss prevention

The old resolver read a nonexistent free `constraint.value`. Phase 803 replaces that with an ADT projection from `RouteConstraintArgument` to the existing upstream `RouteConstraint` algebra. Pattern and set constraints are preserved; an empty/none argument projects to the existing unconstrained semantic variant rather than inventing data.

## Audit

`packages/core/scripts/audit-phase803-route-group-upstream-frontier.cjs`

Result: `allPass: true`.

## Build status

The user's local build is the authoritative full-build check. The sandbox does not contain the repository's installed `tsup`/type packages, so this phase is not claimed as a full `npm run build` pass here.
