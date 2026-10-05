# Phase 913 — Upstream Compiler Isolation Audit

The upstream production contract layer must not depend on concrete compiler/scanner AST types.

## Invariant

`packages/core/src/types/upstream` production `.ts` files must have:

- zero imports from `compiler/`;
- zero references to concrete scanner AST types such as `RouteDeclarationAst`, `ControllerMethodAst`, `ProviderSourceAst`, and controller parameter AST types.

Scanner implementations remain producers/adapters of upstream-neutral evidence contracts.

## Dataflow boundary

`SemanticDataFlowInterfaceContract<I, F, G>` remains the upstream contract. Scanner-specific `KnowledgeId`, facts, and guards are bound at the implementation edge. `AstDataflowInterface` remains the AST-level authority and carries provenance from semantic knowledge dataflow.

## Laravel alignment

Laravel's `HasMiddleware`, controller attributes, `middlewareFor`, and `withoutMiddlewareFor` are semantic contracts/evidence with method and scope applicability. They should not force the upstream layer to depend on concrete parser AST nodes.

## E-commerce fixture policy

The workspace does not contain `examples/ecomerce-shop-source` or `examples/ecommerce-shop-source`. Existing e-commerce regression tests remain the regression surface; no missing fixture is invented.
