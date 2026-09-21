# AST / ADT Connection Trace

## Rule

Connect the real Laravel `ecommerce_shop` source to the existing upstream AST/ADT vocabulary. Do not create a second interface to hide missing semantic data. Compiler errors identify where the upstream producer must be raised. Downstream is not modified during this trace.

## Canonical flow

```text
Laravel ecommerce_shop
  -> source scan
  -> lexer / parser
  -> producer AST / ADT
  -> trace
  -> suggestion
  -> repair producer / existing interface
  -> trace again
  -> all SourceAsts categories
  -> CompleteSourceAst
  -> RouteSyncManifest
  -> downstream (not modified)
```

## Current producer boundary status

| Boundary | Existing producer | Upstream AST entrypoint | Status |
|---|---|---|---|
| Model | `ModelScanner.scanAsts()` | `ModelAst` | connected |
| Resource | `ResourceScanner.scanAsts()` | `ResourceAst` | connected |
| Request | `FormRequestScanner.scanAsts()` | `RequestAst` | connected |
| Route | `RouteScanner.scanAsts()` | `RouteAst` | connected |
| Controller | `ControllerScanner.scanCanonicalAsts()` | `ControllerAst` | connected |
| Response | `scanResponseAsts()` | `ResponseAst` | connected |
| Service | `scanServiceAsts()` | `ServiceAst` | connected |
| Migration | `scanMigrationAsts()` | `MigrationAst` | connected |
| DTO | `scanDtoAsts()` | `DtoAst` | connected |
| Middleware | `scanMiddlewareAsts()` | `MiddlewareAst` | connected |
| Provider | `scanProviderAsts()` | `ProviderAst` | connected |
| Attribute | `scanAttributeAsts()` | `AttributeAst` | connected |

## SourceAsts assembly

`packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts` is the current assembly boundary. It produces all 12 existing `SourceAsts` categories as `scanned(...)` discoveries.

```text
scanSourceAsts(projectRoot)
  -> models
  -> resources
  -> requests
  -> routes
  -> controllers
  -> responses
  -> services
  -> migrations
  -> dtos
  -> middlewares
  -> providers
  -> attributes
```

No `notScanned()` category remains in the canonical `scanSourceAsts()` result.

## CompleteSourceAst boundary

`packages/core/src/types/upstream/completeness.ts` validates all 12 `SourceAsts` discoveries before creating the proof-carrying `CompleteSourceAst`.

```text
SourceAsts
  -> validateCompleteSourceAst(...)
  -> CompleteSourceAst
```

The proof means all required source categories reached a scanned discovery state. It does not claim every individual PHP construct has perfect semantic fidelity; unsupported constructs remain producer-level trace targets.

## Manifest producer

The canonical Manifest producer is:

`packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts`

```text
scanRouteSyncManifest(projectRoot)
  -> scanSourceAsts(projectRoot)
  -> validateCompleteSourceAst(...)
  -> CompleteSourceAst
  -> RouteSyncManifest
```

`ManifestVersion 6.0.0` is the RouteSync Manifest contract version, not the Laravel application version.

## Provenance trace

The Manifest source currently records the project root and a synthetic root `SourceSpan` at line 1. This is valid as Manifest-level provenance but is less precise than the per-AST `SourceSpan` data already carried by producers.

Do not invent a new provenance interface. If finer Manifest provenance becomes necessary, raise the existing producer/source vocabulary first.

## Attribute trace correction

`AttributeDefinition.constructor` uses the existing `Expression` vocabulary. A PHP constructor declaration is not a runtime `ResolvedExpression` result, so it must not be represented as `unresolved(unsupported)` merely to satisfy the interface. Constructor declaration parameters remain upstream semantic data.

## Boundary rule

```text
CompleteSourceAst -> Manifest
```

is the final upstream boundary for this phase.

Do not modify downstream consumers while repairing scanner, lexer, AST/ADT, completeness, or Manifest provenance. Downstream errors may be traced only to determine what semantic information the upstream boundary must carry.
