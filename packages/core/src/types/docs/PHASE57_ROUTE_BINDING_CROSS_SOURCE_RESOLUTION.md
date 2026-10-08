# Phase 57 — Route Binding Cross-Source Semantic Resolution

`RouteAst` remains an upstream construction artifact and `RouteProducer` remains
an AST producer. This phase does not remove or flatten the AST.

The new upstream resolver joins three already-known facts:

1. route URI binding syntax (`RouteBindingContract`),
2. controller / callback action parameter signature, and
3. the upstream model registry.

Only when the route parameter name matches an action parameter and that action
parameter type matches a known model is the binding elevated to
`implicit_model`. Otherwise it remains a plain route parameter binding.

This follows Laravel's documented implicit binding rule rather than guessing
from `{user}` or `{post:slug}` alone.

Flow:

Laravel source
-> RouteDeclarationAst
-> RouteProducer
-> RouteAst
-> RouteBindingContract
-> controller/action semantic contract
-> model registry
-> ResolvedRouteBindingContract
-> CompleteLaravelSourceModel
-> RouteSyncManifestFlow

The downstream flow receives the resolved semantic fact and does not need to
interpret Laravel route syntax or reflection rules.
