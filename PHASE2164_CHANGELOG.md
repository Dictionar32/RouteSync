# Phase 2164 — Exact Response Attribute Provenance

- Evolved the existing parsed `DeclaredResponseAttributeAst` to retain the exact `#[...]` token span and reject incomplete attribute spans at the parser boundary.
- Evolved the existing `ControllerProducer` interface/contract to transport that source range as typed upstream provenance.
- Evolved `ControllerResponseAttributeSourceEvidence` so a declared response attribute carries its exact `SourceSpan`.
- Updated the existing integrated response evidence producer to publish declared-attribute evidence at that exact span; absent attributes remain explicit and use method-observation provenance.
- Advanced the existing producer contract to v5, response evidence production contract to v7, and integrated response pipeline contract to v18.
- Added focused audit `scripts/audits/audit-phase2164-response-attribute-provenance-closure.cjs` and Phase 2164 trace/verification reports.
- Verification: Phase 2164 audit 12/12; syntax-only transpilation of 8 changed TypeScript files has 0 diagnostics; Phase 2159 audit 14/14.
- The Phase 2160 audit run during regression checking reported 13/15 because two assertions about published action semantic naming/wiring do not match the current tree. Those assertions concern files unchanged by Phase 2164; baseline status was not separately established. Full typecheck/build/Vitest were not run.
- Explicitly not completed: retirement of `resolveResponse()` / `responseAttributeScanner.ts`, production of DTO declaration evidence, and migration of response descriptor/DTO semantic ownership into the integrated pipeline.
- No new authority, `relation/foundation`, or subscanner was introduced.
