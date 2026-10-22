# Phase 2285 Trace — Contextual Attribute Resolved Identity

## Route trace

`packages/cli/src/commands/scan.ts` → `controllerInvocationManifestComposition.ts` → `laravelSourceAstPipeline.ts` → `LaravelAttributeScannerInterface` result → `LaravelControllerScannerInterface.contextualAttributeInventory` → `laravelControllerScanner.ts` projects declaration keys into dependency judgment input.

## Finding

Phase 2284 stored only the name-resolution rule in the implementation proof. That omitted the actual resolved qualified name. The inventory also exposed only a short `ClassName` as its identity, despite PHP class/interface imports and aliases meaning that short names are not globally unique.

## Change

The existing upstream attribute scanner contract moves to version 4. Its proof now retains the full successful `PhpClassNameResolution`, canonical qualified declaration identity, and interface source span. Each inventory declaration keeps the short key for existing dependency consumers and also preserves `qualifiedIdentity` for semantic identity.

## Not done

The source producer `attributeAstCanonical.ts` still uses a short-name regex and does not construct this proof. The runtime/wiring has not been changed. This phase deliberately does not claim the source producer satisfies the new contract. Next step: evolve the existing attribute evidence producer to use parsed interface names, the owning lexical namespace/import context, and the existing `PhpClassNameResolutionRuleInterface`; publish a proven declaration only when the resolved interface identity is exactly the canonical Laravel contract.

## Validation

The static audit checks the upstream contract shape and the outstanding producer debt. No TypeScript typecheck/build was run. No `semantic/foundation` or `semantic/relations` imports were added to upstream interfaces.
