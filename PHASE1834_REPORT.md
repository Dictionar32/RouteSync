# RouteSync Phase 1834 — Laravel Source Identity Domain Contract

## Scope

Interface-first correction of source identity semantics used by Laravel controller invocation judgment inventory closure.

## Trace findings

- `SourceProjectIdentity` already owns the domain shape: `kind`, `root`, and `source` provenance.
- `source` is provenance (`SourceSpan`), not a project identity component. Comparing its file/span coordinates incorrectly made provenance affect project equivalence.
- `SourceFile` already owns the canonical file identity value.
- The previous `SourceProjectIdentityRule` and `SourceFileIdentityRule` encoded the rule as tuples of string labels. Those labels were not domain types and forced runtime code to interpret a string list.
- Invocation judgment already correlates `sourceFile` and `PhpSourceInvocationSemanticPipelineIntegrationResult` in one value; the scanner interface already requires the authority closure receipt.

## Changes

- Removed the string-component rule aliases and their public exports.
- Advanced `LaravelSourceIdentitySemanticsContract` to version 4; it no longer carries fake component-list data.
- Project identity relation now uses the canonical project root, not the provenance span.
- Source-file identity relation uses the canonical `SourceFile` value.
- Both operations continue to return closed typed relation judgments, not booleans.
- Inventory contract advanced to version 8 and composes the actual `LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT` as a typed dependency.
- Kept invocation semantic judgment and integrated response correlated in one judgment.
- Added static audit `audit-phase1834-laravel-source-identity-domain-contract.cjs`.

## Audit

`node scripts/audits/audit-phase1834-laravel-source-identity-domain-contract.cjs`

Result: 18/18 checks passed.

`package.json` parses successfully. Build, typecheck, and E2E were not run.

## Explicitly unfinished

Production wiring still calls `ControllerScanner.scanCanonicalBundle()` and `ControllerScanner.extractResourceDataflow()` in `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`. The production scanner migration and subscanner retirement are not claimed complete by this phase.
