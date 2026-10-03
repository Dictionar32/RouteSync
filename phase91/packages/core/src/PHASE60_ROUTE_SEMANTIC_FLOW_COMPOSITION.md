# Phase 60 — Route Semantic Flow Composition

Laravel route semantics are now composed into one upstream `RouteSemanticFlow`.
The purpose is not to remove `RouteAst`, but to make the downstream interface
consume a semantic contract instead of reconstructing route meaning.

## Validated Laravel path

Laravel documents route groups as shared route attributes whose nested values
are merged upstream: middleware and `where` conditions are merged, while names
and URI prefixes are appended. Laravel also resolves implicit model binding from
the relationship between the route parameter and the typed action parameter,
not from URI spelling alone.

The semantic pipeline therefore remains:

Laravel source
-> RouteDeclarationAst
-> RouteProducer
-> RouteAst
-> semantic resolvers
-> RouteSemanticFlow
-> CompleteLaravelSourceModel
-> RouteSyncManifestFlow
-> consumer

## What Phase 60 changes

`RouteSemanticFlow` composes:

- route identity (method, semantic path, target);
- resolved route-group context;
- middleware provenance flow;
- route binding declarations;
- cross-source resolved binding contracts.

The flow contains no AST field and imports no lexer AST type.

## Architectural rule

`RouteProducer` remains an AST producer. `RouteAst` remains available in the
upstream construction artifact. The AST boundary is moved upstream; it is not
deleted merely to make an interface look clean.

The downstream interface can now depend on `RouteSemanticFlow` without knowing
whether the facts came from PHP tokens, Laravel attributes, controller
reflection, or another upstream source.

## Important limitation

This phase composes already-elevated facts. It intentionally does not claim
that the current partial workspace has complete Laravel controller-attribute
scanning or explicit-binding integration. Those remain separate upstream
inputs until their scanners are present in the complete workspace.
