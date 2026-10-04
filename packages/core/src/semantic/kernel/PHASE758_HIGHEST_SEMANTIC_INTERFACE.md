# Phase 758 — Highest Cross-Stage Semantic Interface

## Build frontier

The local DTS frontier reported three errors in `validationRuleSet.ts`. They were treated as ADT inference failures, not assertion opportunities:

1. `RequestFieldRequirement` now remains a closed result type through every nested `relationVariantFold`.
2. `ValidationFieldNode` now remains the common result algebra across scalar/array/object branches through explicit relation-fold result types.
3. No `as unknown`, `as any`, or `as const` was introduced to silence the DTS checker.

## Highest AST interface correction

`astSemanticStageInterfaceAlgebra.ts` previously attempted to expose generic `AstSemanticFact` values as `AstSemanticStageFact` values. That weakened the stage boundary and is rejected by strict TypeScript typing.

The stage interface now obtains its facts through the authoritative `astSemanticStageFacts(stage, facts)` relation projection. The transport boundary therefore carries only the closed fact variant belonging to its stage.

The semantic pipeline is consequently:

`Laravel source evidence -> scanner evidence -> upstream mapping -> resolver graph -> analysis/data-flow -> semantic type lowering -> target projection`

Every stage is a closed judgment over facts, derivations, preservation obligations, and least-fixed-point reasoning.

## Parsed descriptor vacuum

The legacy parsed AST reservoirs remain zero-byte and have no production `ParsedDescriptor`/`parsedDescriptor` authority. Canonical AST semantic interfaces are the only semantic authority.

## Research alignment

RouteSync adopts the strongest applicable ideas from the surveyed systems:

- MLIR PDLL/DRR/PDL: declarative match/rewrite separation and an explicit pattern IR.
- WebAssembly validation: declarative validity constraints over a typed abstract syntax model.
- CodeQL/Soufflé: semantic/data-flow relations as the analysis substrate rather than AST traversal state.
- K/Maude: executable rewrite semantics over explicit configurations/terms.
- egglog/e-graphs: equivalence-aware rewrite saturation where normalization benefits from it.
- SeaHorn/SMT/Rosette/Alive2: proof obligations and solver-backed validation at selected semantic boundaries, not as the primary AST model.
- CompCert: explicit intermediate semantic languages and preservation obligations between compiler passes.
- circular attribute grammars/data-flow fixed points: monotone stage closure and derived attributes without host control-flow ownership.
- CIRCT/MLIR and Cranelift: explicit IR boundaries and lowering contracts.

## Laravel ecommerce semantic fixture

The public Laravel ecommerce examples surveyed expose recurring source facts: products, categories, variants, carts, cart items, orders, order items, payments, customers/addresses, coupons, inventory, and route groups. These should enter RouteSync as typed source evidence and semantic relations, not as free-form descriptor bags.

The target projection should derive Next.js route/page/API contracts from canonical relations such as:

- `route_declares_resource`
- `route_accepts_request`
- `request_requires_field`
- `model_exposes_property`
- `model_exposes_relation`
- `cart_contains_product`
- `order_contains_item`
- `resource_projects_field`
- `target_projects_route`
- `target_requires_type`

The ecommerce application is therefore a semantic workload for the compiler, not an alternate AST authority.

## Remaining frontier

The strict relational audit still reports broad host-language leakage in scanner/lexer and resolver/analysis code. The next migration should prioritize production authority in this order:

1. scanner evidence and parser adapters: syntax evidence only;
2. upstream mapping: closed identity/provenance facts;
3. resolver graph: candidate/edge/conflict/resolution relations;
4. analysis/data-flow: reachability, dependency, dominance, proof facts and fixed-point closure;
5. semantic type lowering: closed type judgments and compatibility relations;
6. diagnostic core: closed diagnostic location/fix/severity judgments;
7. rewrite engine: declarative match/rewrite rules with convergence/provenance;
8. target projection: canonical Next.js facts only.

Host `if/for/while/switch`, collection combinators, nullish/undefined/null mechanisms, assertions, and unconstrained primitive payloads must be removed only when they are implementation authority. Source-language tokens such as PHP `if`, `for`, `switch`, `null`, `??`, and `===` remain legitimate evidence values when they describe Laravel source syntax.
