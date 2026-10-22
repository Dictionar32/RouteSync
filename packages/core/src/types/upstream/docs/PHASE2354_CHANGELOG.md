# Phase 2354 changelog

- Added the closed upstream judgment `laravel_route_declaration_method_query` to the existing route method ADT.
- Wired that judgment into the canonical Laravel route scanner and route emission.
- Added QUERY to the current route/HTTP vocabularies and route IR method type.
- Preserved the semantic distinction between HTTP QUERY and query-string payload placement.
- Advanced route method authority version to 6 and route scanner/scan judgment versions to 22.
- Static audit: Phase 2354 20/20; updated Phase 2350–2353 audits 60/60.
- Incomplete: SDK HTTP client QUERY execution, TypeScript type-check, Vitest, CLI E2E, and full build remain unverified.
