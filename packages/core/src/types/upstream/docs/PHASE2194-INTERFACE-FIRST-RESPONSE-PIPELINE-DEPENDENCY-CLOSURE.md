# Phase 2194 — Interface-first integrated response dependency closure

## Trace finding

The integrated response pipeline already had a named `LaravelControllerResponseSemanticPipelineInterface`, but its factory accepted only the DTO response-contract projection authority. Class-name resolution, DTO declaration resolution, DTO property type-reference binding, source identity and AST projection were still selected inside the implementation. That made the public interface describe a more open composition than the runtime actually allowed.

## Change

- Evolved the existing response-pipeline interface with a typed `LaravelControllerResponseSemanticPipelineDependenciesInterface` bundle; this is a composition contract over existing authorities, not a new semantic authority or scanner layer.
- Evolved the existing pipeline contract from version 25 to 26.
- Added a backwards-compatible dependency override parameter to `createLaravelControllerResponseSemanticPipeline`.
- Integrated declaration-source correlation, response evidence binding, PHP class-name resolution, DTO declaration resolution, DTO property type-reference binding, DTO response projection and AST projection now consume authorities from that dependency contract.
- The pipeline publishes the exact source-identity-bound evidence-binding authority it uses rather than exposing a singleton that could disagree with injected identity semantics.
- Kept the existing invocation judgment as the canonical invocation result; no invocation reclassification was added.

## Deliberate limits

- The default composition root still binds the existing default authorities; production injection is now explicit and testable, not automatically replaced with different semantics.
- The response semantic judgment authority/runtime executor and other lower-level authorities still retain their own canonical default source-identity metadata. This phase does not claim all transitive authority imports have been eliminated.
- The parser's compatibility defaults and any other direct authority imports outside this pipeline still need separate trace-and-migration work.
- DTO discovery order and the source-AST pipeline's current post-controller DTO scan remain a separate upstream dataflow gap; this phase does not claim cross-file DTO inventory is now available earlier.
- No relation/foundation/subscanner layer was added.

## Validation

- TypeScript syntax transpilation was run on the changed interface and pipeline files only.
- ZIP integrity was checked after packaging.
- Full TypeScript typecheck, Vitest, and package build were not run.
