# Phase 759 — Boundary Canonical Resolution

## Build frontier

The DTS frontier exposed a semantic boundary problem in the route resolver perimeter rather than a missing assertion:

- the boundary factory referenced `relationEqual` without importing the relation authority;
- the factory resolved an authoring boundary into `ResolvedRouteBoundaryOptions` but builders still accepted the sparse authoring union;
- the resolved model did not carry the controller runtime/semantic return judgments;
- optional authoring coordinates could widen `Presence<T>` into `Presence<T | undefined>`.

## Model elevation

The route boundary now follows:

`authoring boundary evidence -> resolved boundary semantic model -> subcontract construction -> complete route contract`

`ResolvedRouteBoundaryOptions` is the canonical perimeter judgment. Identity, binding, capability and provenance builders consume this resolved model or a narrow coordinate projection instead of reopening the sparse authoring union.

The semantic core therefore does not use optional authoring fields as its ontology. Optionality is normalized at the perimeter into `Presence<T>` and then into a closed resolved judgment.

## AST/data-flow trace

Laravel route evidence is intended to flow through:

`source syntax evidence -> closed route AST evidence -> upstream mapping judgment -> resolver graph facts -> route boundary judgment -> capability/binding/identity facts -> semantic relations -> fixed point -> rewrite -> Next.js projection`

No parsed-descriptor reservoir is reintroduced.

## Research alignment

MLIR PDLL/PDL separates matching from rewriting and represents the pattern itself as a model that can be transformed. WebAssembly specifies validation declaratively over typed abstract syntax. CompCert makes semantic preservation the compiler correctness obligation. These patterns support keeping RouteSync's resolver boundary as a typed judgment and moving semantic decisions into relations and rewrite rules rather than host control flow.

## Next frontier

The next authority pass should target, in order:

1. resolver graph facts and edges;
2. upstream mapping interfaces;
3. route AST data-flow facts;
4. semantic type lowering;
5. diagnostic judgments and error-core relations;
6. parser adapter/generic solver boundaries;
7. rewrite normalization and target projection.

Host constructs are removed only when they encode semantic knowledge. Source-language tokens such as PHP `if`, `switch`, `null`, `??`, and `===` remain valid scanner evidence.
