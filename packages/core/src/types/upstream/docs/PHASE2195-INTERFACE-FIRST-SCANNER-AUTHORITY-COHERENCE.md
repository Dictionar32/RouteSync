# Phase 2195 — Interface-first scanner authority coherence

## Trace finding

The production Laravel controller scanner exposed an `astProjectionAuthority` independent of `responseSemanticPipeline.astProjection`. That allowed the parser and the integrated response pipeline to be composed with different AST projection authorities. Controller inheritance parsing also called the concrete PHP class-name authority directly, even though the integrated response pipeline already owned an injectable class-name resolution authority.

## Change

- The scanner's `astProjectionAuthority` property is now a getter derived from `responseSemanticPipeline.astProjection`; there is one authority owner in production composition.
- The canonical production parser receives both `responseSemanticPipeline.astProjection` and `responseSemanticPipeline.dependencies.classNameResolutionAuthority`.
- Controller declaration parsing accepts the existing `PhpClassNameResolutionRuleInterface` and uses it to judge parent-class names. No new semantic authority was introduced.
- The scanner contract version advances from 35 to 36, and its parser-ownership contract records the shared authority boundary.
- Existing syntax-only/direct parser entry points retain their default authorities for compatibility. They are not used to select separate production authorities in the canonical scanner path.
- No `relation`, `foundation`, or subscanner layer was added. Existing parser relation helpers remain in the legacy syntax implementation and were not expanded as a new semantic layer.

## Trace after change

`source invocation inventory -> canonical invocation judgment -> scanner -> parser projection using pipeline-owned AST and PHP class-name authorities -> integrated response judgment -> AST projection using the same pipeline-owned AST authority -> scanner artifact`

The invocation judgment remains the semantic input. The parser does not derive a second invocation judgment, and the runtime executor remains downstream of the closed response judgment.

## Remaining gaps

- The direct parser compatibility entry points still have concrete defaults; further removal requires an explicit compatibility migration, not a silent breaking change.
- Other upstream authorities may still compose their own defaults internally; this phase only unifies the production scanner/parser boundary.
- DTO declaration inventory timing and method-scoped canonical response product closure remain open.
- Full typecheck, Vitest, and package build were not run.
