# Phase 2994 Changelog

- Added `ControllerActionSchemaRouteRequestEvidence<TSourceIdentity>` in the upstream schema interface.
- Added the domain-specific `ControllerActionSchemaSemanticJudgment.forRouteRequest()` operation.
- Implemented that operation in the interface-typed, frozen `controllerActionSchemaSemanticJudgmentAuthority` runtime object.
- Updated controller action contract projection and canonical semantic publication to consume `forRouteRequest().schema` rather than reaching directly into `derivation.schema`.
- Exported the evidence ADT from upstream and core public barrels.
- Added a repeatable static audit and a trace report that explicitly records the remaining gap: route boundary retains the schema payload, but not the entire schema-provenance evidence packet.
- No repository-wide `export function` rewrite was attempted; migration remains runtime-path-scoped.
