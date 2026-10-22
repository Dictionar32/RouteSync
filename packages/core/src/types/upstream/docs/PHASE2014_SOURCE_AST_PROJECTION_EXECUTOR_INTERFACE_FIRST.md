# Phase 2014 — Source-AST Projection Executor Interface First

## Trace finding

The existing `LaravelSourceAstPipelineInterface` and `LaravelSourceAstScannerInterface` already declared an outcome-indexed `LaravelSourceAstProjectionJudgment`, but the runtime implementation and scanner facade still returned plain `SourceAsts` and advertised contract version 2. This was an actual contract/runtime mismatch, not a missing extra abstraction.

The manifest builder then performed completeness validation itself, so the pipeline boundary did not own the completeness judgment it was designed to publish.

## Change

- Evolved the existing source-AST executor to preserve the exact invocation inventory receipt subtype and return the existing complete/blocked projection ADT.
- Used the canonical `validateCompleteSourceAst` authority to decide completeness.
- Generalized the existing completeness validator to preserve the AST subtype in its complete proof, without casts or a second completeness authority.
- Updated the existing scanner facade to preserve the ADT instead of unwrapping it to `SourceAsts`.
- Updated the manifest builder to consume the complete projection arm and fail closed on the existing blocked arm, rather than repeating completeness classification.
- Aligned runtime pipeline and scanner contract versions to version 3.

## Invariants

- `controllerInvocationSemanticInventory` remains embedded in canonical `SourceAsts` and preserves the exact receipt subtype.
- `IncompleteUpstream` remains the canonical blocked completeness judgment.
- No new `relation` or `foundation` subscanner was added.
- No invocation or response semantic authority was duplicated.

## Verification limits

The phase audit and TypeScript syntax transpilation verify the source contract shape and syntax only. They do not establish a full project typecheck or build; those remain unverified in this environment.
