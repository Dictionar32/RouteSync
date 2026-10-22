# Phase 2154 Changelog

- Evolved `LaravelControllerScanArtifact` to publish the exact existing per-action semantic judgment alongside its source/controller/action identity.
- Advanced controller scan contract version to 32 and route scanner contract version to 4.
- Added closed route-side action-judgment correlation outcomes: matched, unmatched, ambiguous.
- Wired the existing route boundary to project canonical action request judgments across `no_request`, `form_request`, `framework_request`, `typed`, and `typed_unresolved`.
- Added `unresolved_action_request` and `unresolved_action_input` ADT variants so unmatched/ambiguous action correlation cannot silently become `no_request` or `no_input`.
- Updated endpoint projection and request-type aggregation to preserve and respect unresolved action correlation.
- Removed the now-closed `typed_request_binding_projection_loss` item from the open derivation ownership remainder; other legacy action derivation and publication gaps remain open.
- No `relation/foundation`, new subscanner, duplicate semantic authority, or type assertion was introduced in the new publication/correlation path.
- Audit: 26/26 static assertions and syntax-only transpilation checks passed.
- Full build, full typecheck, and Vitest were not run.
