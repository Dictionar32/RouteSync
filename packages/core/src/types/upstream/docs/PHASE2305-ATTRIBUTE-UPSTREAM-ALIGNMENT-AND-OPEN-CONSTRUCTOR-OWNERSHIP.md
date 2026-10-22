# Phase 2305 — Attribute Upstream Alignment and Constructor Ownership

## Decision

Keep the existing `LaravelAttributeScannerInterface` in place at contract v18. Do not add a second scanner interface, a generic wrapper authority, or a new constructor-selector interface merely to move a `.find(...)` call.

The current upstream declaration authority (`ControllerDeclarationSemanticJudgmentAuthorityInterface`) closes controller action eligibility and ancestry. Its action-selection ADT deliberately excludes `__construct` from executable actions, but it does **not** publish a selected constructor as a separate semantic result. Therefore it is not yet a semantically compatible source for the attribute producer's constructor-expression requirement. Reusing its action selection would be incorrect: an excluded constructor is not the same thing as a constructor value selected for attribute construction.

## CLI datum trace

`packages/cli/src/commands/scan.ts`
→ `buildManifestWithInvocationPipeline(...)`
→ `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
→ `manifestBuilder.build(...)` / `constructRouteSyncManifest(...)`
→ `laravelSourceAstPipeline.execute(...)`
→ injected `LaravelAttributeScannerInterface.scan(sourceProject)`
→ `scanLaravelAttributes(...)`
→ `attributeProducer.produce(...)`
→ `AttributeProducerJudgment` (complete or blocked)
→ pipeline publishes `attribute_asts` only through the scan's closed result.

The scanner contract publishes the fixed `app/Attributes` scope in its discovery receipt. A missing or unreadable scope must remain a typed blocked outcome, not an empty successful inventory. The pipeline's composition root declares the same v18 contract literal and injects `scanLaravelAttributes`.

## Findings

1. **Aligned:** scanner interface, implementation, and pipeline composition root agree on v18 and the project-identity input.
2. **Aligned:** the producer's missing-constructor outcome is a typed blocker, propagated through the scanner's failure sequence and surfaced by the manifest builder.
3. **Aligned since Phase 2304:** provider method closure projection now uses the existing PHP AST expression authority rather than directly invoking `resolveClosureBody`.
4. **Still open:** `attributeProducer.produce` selects `__construct` with `declaration.methods.find(...)`. The controller scanner has a separate constructor lookup for dependency-injection parameters. These two lookups have related syntax but different semantic consumers and should not be merged by name alone.
5. **Upstream gap:** the existing controller declaration judgment does not expose a constructor-selection judgment. Before migrating the lookup, evolve that existing semantic judgment only if its input evidence and ownership can correctly serve both consumers; otherwise retain the scanner-local producer boundary and record the gap rather than inventing a weak duplicate contract.
6. **Not claimed solved:** transitive `semantic/relations` dependencies inside the expression-authority implementation remain. Phase 2304 removed a direct consumer bypass, not the transitive dependency tree.

## Interface-first acceptance criteria for the next implementation phase

- An upstream contract must express the semantic result needed by consumers, not just wrap a callback or expose raw method arrays.
- Constructor absence, a uniquely selected constructor, and any ambiguous/malformed source condition must be representable as closed outcomes if the parser can produce those conditions.
- The result must preserve declaration/source identity and the selected method's evidence together; consumers must not re-correlate parallel arrays or re-run `.find(...)`.
- The CLI remains a wiring/projection layer and must not perform constructor classification.
- No `semantic/foundation` or `semantic/relations` imports may be added to new contract paths.

## Verification boundary

The accompanying structural audit checks the CLI datum path and contract alignment. It does not claim TypeScript typecheck, package build, or runtime integration tests passed.
