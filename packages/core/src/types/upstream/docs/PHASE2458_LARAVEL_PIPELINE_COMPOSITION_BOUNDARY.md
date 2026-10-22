# Phase2458 — Laravel Pipeline Composition Boundary

The existing `LaravelSourceAstPipelineDependenciesInterface` remains the single dependency contract. Its canonical value now lives in `compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts`, typed as `export const laravelSourceAstPipelineDependencies: LaravelSourceAstPipelineDependenciesInterface = ...`.

The runtime executor stays in `laravelSourceAstPipeline.ts` and continues to consume a pre-bound input through parameterless `execute()`. The runtime module no longer imports model, Form Request, response, migration, DTO, query, schema, service, middleware, or provider legacy scanner implementations directly.

This is not full subscanner retirement: those concrete implementations remain selected by the composition root. The channel scanner remains a direct legacy call until source-backed subscription evidence and the existing `BroadcastChannelKindJudgmentAuthority` are connected. Do not replace that missing authority with pattern inference, an empty evidence list, or a duplicate interface.
