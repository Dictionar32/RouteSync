# Scanner / Resolver Research — Phase 391

## External architectural signals

MLIR's PDLL is explicitly a declarative pattern language centered on match constraints and rewrite sections; its model separates matching from transformation rather than encoding the algorithm as imperative traversal. See MLIR PDLL documentation.

Soufflé models analysis state as typed relations and rules. Rules describe when tuples belong to derived relations, allowing the engine to synthesize execution rather than making traversal order the semantic definition.

JastAdd demonstrates that fixed-point analyses can be written declaratively through circular attributes. Iteration is delegated to the evaluation engine under monotonic/finitary conditions.

## RouteSync implication

Scanner and lexer code should therefore be treated as evidence producers, not semantic judges. The preferred authority boundary is:

1. scanner emits syntax evidence;
2. candidate relations bind possible meanings;
3. constraints eliminate inconsistent candidates;
4. fixed-point closure propagates dependencies;
5. rewrite/equality saturation normalizes equivalent candidates;
6. canonical projection exposes one stable semantic model.

The remaining Phase 391 frontier is therefore not “remove keywords” mechanically. It is to remove semantic decisions that are currently encoded by those keywords from scanner/resolver authority and move them into the relation solver.
