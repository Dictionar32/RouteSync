# Phase 450 — Scanner/Resolver Relational Cutover

## Scope

Phase 450 continues from Phase 449 and cuts the active `RouteScanner.scanSource` authority toward a relational pipeline.

### Changes

- HTTP-method dispatch is represented by a relation catalog and lookup rather than a `switch`.
- route file enumeration is a recursive relation projection.
- declaration traversal is a recursive relation fold.
- controller/action candidate selection is represented as relation options/catalog lookup.
- middleware semantic projection uses the relation kernel instead of collection `.map()` in the new scan path.
- emitted route provenance uses relation projection.
- scanner decisions are explicitly treated as candidate facts before semantic emission.

## Remaining compatibility frontier

`routeAstFromRouteSemanticFlow` and older parameter/target compatibility projections still contain legacy TypeScript constructs. They are not silently counted as eliminated. The next cutover should move those projections behind semantic relation facts and eliminate their sentinel/branching representations.

## Target architecture

characters -> lexical facts -> token candidates -> scan transitions -> requirement solver -> rewrite/equality closure -> fixed point -> canonical semantic facts -> resolver candidate relations -> resolution solver -> semantic projection.

## External design references

- egglog unifies Datalog and equality saturation, including rewriting, congruence closure, extraction and fixed-point reasoning.
- SDF3 treats lexical syntax declaratively as productions over character classes, making a scannerless direction viable.
- eqlog models Datalog with equality and closes rules to a fixed point.
