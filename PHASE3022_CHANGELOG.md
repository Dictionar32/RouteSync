# Phase 3022 changelog

- Replaced the raw-string `createSourceFile` constructor with `sourceFileIdentityFactory.create(StringValue)`.
- Migrated direct runtime and test call sites, including array-mapping call sites, to the typed source identity factory.
- Updated public core and semantic-value exports to expose the canonical factory.
- Added an AST-based audit for source-file identity factory ownership and the existing CLI manifest runtime path.
- Preserved the protected one-byte `collections.ts` invariant and did not restore deleted relation-foundation modules.
- Scope limitation: other raw primitive domain factories and control-flow patterns remain and require separate owner-by-owner migrations.
