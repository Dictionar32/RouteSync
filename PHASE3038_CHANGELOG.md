# Phase 3038 changelog

- Added closed typed judgments for KnowledgeId membership and unordered alias-pair membership.
- Added domain-owned identity-link proof-premise selection to `SemanticObjectIdentityOperationsInterface`.
- Replaced object identity consumer calls to `.some`, `.filter`, and `.findIndex` with domain operations / explicit accumulation.
- Preserved alias evidence when duplicate unordered pairs are merged.
- Added Phase 3038 static audit and regression assertions.
- Preserved the CLI → invocation pipeline → object identity analysis runtime trace.
- Did not restore deleted relation foundation modules; kept `collections.ts` as exactly one newline byte.
