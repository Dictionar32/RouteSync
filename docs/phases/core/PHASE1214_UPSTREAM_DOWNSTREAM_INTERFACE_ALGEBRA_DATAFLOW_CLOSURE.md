# Phase 1214 — Upstream → Downstream Interface Algebra and Dataflow Closure

## Scope

This phase strengthens the semantic boundary without adding another classifier/resolver layer.

The canonical path is:

```text
Laravel source evidence
  -> upstream semantic authority
  -> closed capability / dataflow judgment
  -> downstream-owned InterfaceDependencyBoundary
  -> manifest / graph / IR / CLI projection
```

## Capability contract

`SemanticCapabilityContract` remains the closed upstream semantic contract. Its algebra is composed from:

- identity
- evidence
- derivation
- provenance
- closure
- kind
- authority

The default identity is `never`, preventing an `unknown` identity escape.

## Dataflow contract

`DataFlowInterface` remains generic and domain-neutral. Its two explicit facets are:

- `DataFlowExecutionAlgebraInterface`: seed, derive, close
- `DataFlowAuthorityAlgebraInterface`: input, state, reaches, closed

Downstream projections consume `DataFlowAuthorityInterface`, not the execution surface.

The semantic dataflow authority now uses relation primitives for reach/path closure construction rather than direct `filter`, `map`, `flatMap`, or collection iteration in those closure stages. Fixed-point closure remains explicit and bounded.

## CLI boundary

The canonical route capability consumer is now named `projectRoutes`. The historical `classifyRoutes` symbol remains only as a compatibility alias. The projection reads `route.capability.crudRole`; it does not infer CRUD meaning from method/path.

## Composition algebra

For contracts `A`, `B`, and `C`:

```text
A --P(A,B)--> B --P(B,C)--> C
```

where each `P` is a downstream-owned `InterfaceDependencyBoundary`.

The upstream contract never imports the downstream projection boundary. Composition therefore preserves the dependency direction:

```text
upstream meaning -> closed contract -> downstream projection
```

## Remaining frontier

`ResourceModelResolver` remains a scanner-side semantic wiring frontier because its current inputs include compiler-owned `ModelSymbolTable` and resource/controller evidence. It must first receive an upstream-neutral evidence contract before being migrated; moving the resolver file alone would invert the dependency boundary.

## External model alignment

This shape is consistent with:

- MLIR interfaces: generic interfaces decouple analyses/transformations from concrete operation/dialect semantics.
- MLIR dataflow: lattice/join/monotonicity and fixpoint propagation provide the formal model for closure.
- CodeQL: dataflow nodes are a semantic representation distinct from AST nodes, with source nodes and transitive flow.
- Laravel: route model binding is semantic evidence relating route segments, controller parameters, model types, keys, and scoped bindings.
- TypeScript 7: the native compiler preserves semantic compatibility while changing implementation/runtime architecture, reinforcing stable contracts over implementation coupling.
