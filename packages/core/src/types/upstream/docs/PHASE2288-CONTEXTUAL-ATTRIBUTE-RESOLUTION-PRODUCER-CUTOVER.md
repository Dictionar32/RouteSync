# Phase 2288 — Contextual Attribute Resolution Producer Cutover

## Root cause

Phase 2287 correctly closed the upstream `LaravelAttributeScannerInterface` outcome as complete-or-blocked, but its production composition still advertised contract version 5 and reconstructed the contextual inventory from `AttributeAst.definition.contextual`. The producer still derived that boolean with a short-name regex. This meant the new proof-bearing interface was not the actual source of the CLI pipeline's attribute result.

## Contract and producer change

- Evolved the existing `LaravelAttributeScannerInterface` and both scan outcome arms from contract version 6 to 7; no parallel scanner interface was introduced.
- The canonical producer now reads the declared `implements` names from PHP tokens, derives the declaration's namespace/import context through the existing `phpClassNameResolutionContextAt`, and asks the existing `PhpClassNameResolutionRuleInterface` authority to resolve each name.
- A contextual-attribute proof is published only when the resolved identity equals `Illuminate\\Contracts\\Container\\ContextualAttribute`. The proof preserves the existing resolution rule, exact canonical identity, interface source span, and class's qualified identity.
- If a declaration cannot be classified because PHP name resolution is blocked, the scanner returns the closed blocked judgment. It does not publish the partial AST list or a misleading empty inventory.
- The source-AST pipeline now returns a typed attribute-scan-blocked projection arm before running later source-AST stages. The manifest builder reports that typed blocker instead of reading a non-existent completeness field.
- The producer no longer imports `semantic/relations` or `semantic/foundation` directly and no longer uses the contextual short-name regex.

## CLI trace

`packages/cli/src/commands/scan.ts` → `buildManifestWithInvocationPipeline` → `constructRouteSyncManifest` → `laravelSourceAstPipeline.execute` → injected `LaravelAttributeScannerInterface.scan` → `scanAttributeAsts` → existing PHP lexical-context parser and name-resolution authority → complete/blocked judgment → existing controller scanner accepts only the complete inventory.

When the attribute scan is blocked, the pipeline returns `laravel_source_ast_projection_attribute_scan_blocked`; the manifest builder stops with the source span and typed resolution reason. It does not pass a partial inventory to the controller scanner.

## Scope and verification

The static audit checks the upstream contract, canonical-name proof, absence of the old regex and direct relation/foundation imports, producer wiring, and typed blocked-outcome propagation. `node --check` and the phase audit are run; TypeScript compilation and `npm run build` are intentionally not run in this environment. The parser remains a project-local lexer, not PHP-Parser's full AST/NameResolver, so complex PHP grammar coverage still needs dedicated fixtures and tests.
