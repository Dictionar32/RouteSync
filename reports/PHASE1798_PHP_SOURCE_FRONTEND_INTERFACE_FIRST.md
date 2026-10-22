# Phase 1798 — PHP source frontend interface-first

## Trace result

The existing upstream model already had namespace-region/source inventory authority and invocation batch derivation. The Laravel controller analyzer still receives `PhpFunctionInvocationSemanticIntegrationState`; it does not construct whole-file namespace/import/declaration/invocation evidence. Its method-body AST cannot honestly certify a whole-file inventory.

## Changes

- Added `phpSourceFrontendInterface.ts` as the explicit upstream contract for a typed PHP source document, whole-file extraction, segmented function-name syntax, typed argument evidence, and complete/incomplete coverage.
- The frontend contract prohibits name resolution and invocation judgment derivation. Those remain owned by the existing upstream authorities.
- Exported the contract from the upstream index.
- Strengthened the existing invocation batch closure contract to require each invocation span and each callee syntax span to be contained by the certified whole-file span; violations are typed and reject closure.
- Added `scripts/audits/audit-phase1798-php-source-frontend-interface-first.cjs`.

## Not claimed complete

The existing Laravel parser has not yet been migrated to implement `PhpSourceFrontendInterface`. The scanner continues to preserve its pending integration state until a full-file parser adapter can provide namespace regions, imports, declarations, ordinary function-call syntax, argument evidence, and coverage. This phase establishes and tightens the interface boundary; it does not claim end-to-end source wiring.

## Verification

The Phase 1798 static audit checks the interface contract, export boundary, source-span closure, and truthful scanner status. It is not a TypeScript typecheck or a build. Full build/typecheck was not run.
