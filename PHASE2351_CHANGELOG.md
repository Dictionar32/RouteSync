# Phase 2351 changelog

- Evolved the existing Laravel route method judgment input so method family and parsed target-method evidence travel together.
- Preserved `targetMethods` in all existing judgment ADT variants.
- Updated canonical route emission and `RouteProducerInput` to consume target-method evidence from the judgment rather than rereading the declaration AST.
- Updated the retained legacy caller to use the same existing upstream authority contract.
- Advanced route scanner contract/judgment versions 18 → 19 and method authority version 2 → 3.
- Added focused structural audit and documentation.
- No `semantic/foundation` dependency, duplicate authority, or V2 scanner contract added.

- Closed the `Route::any()` emission gap: the scanner emits the supported HTTP method set while producer projection preserves the `any` ADT without resolving the literal `any` as a single HTTP verb.
