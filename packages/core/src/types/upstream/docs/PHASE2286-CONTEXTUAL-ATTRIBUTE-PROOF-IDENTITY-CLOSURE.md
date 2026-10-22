# Phase 2286 — Contextual Attribute Proof Identity Closure

## Trace

The CLI source-AST path consumes the attribute scan judgment in `laravelSourceAstPipeline.ts`, then passes `contextualAttributeInventory` to the existing `LaravelControllerScannerInterface`. The controller scanner projects the inventory's `ClassName` identities to the existing dependency judgment input.

The Phase 2285 proof was still weaker than its semantic claim: `resolution` accepted any `php_class_name_resolved` result, so a resolved but unrelated interface could inhabit a proof claiming that the declaration implements Laravel's canonical `ContextualAttribute`. It also duplicated the declared class identity in both the outer declaration evidence (`qualifiedIdentity`) and the nested proof (`declarationIdentity`), allowing contradictory identities to be represented.

## Interface-first correction

Evolve the existing `LaravelAttributeScannerInterface` and its result contract to version 5.

- Specialize the proof's resolved-name type to the exact `Illuminate\\Contracts\\Container\\ContextualAttribute` qualified identity.
- Retain the full successful `PhpClassNameResolution` shape, including its source name and resolution rule, while narrowing its resolved identity.
- Keep the declared class's canonical identity owned once by `LaravelContextualAttributeDeclarationEvidence.qualifiedIdentity`; remove the duplicate `declarationIdentity` field from the nested proof.
- Keep the existing `LaravelContextualAttributeInventory` as the one inventory contract consumed by `LaravelControllerScannerInterface`.
- Align only the existing scanner/result version metadata to version 5; no new scanner interface, resolver, generic wrapper, or semantic runtime implementation is introduced.

## Remaining debt (not claimed solved)

`attributeAstCanonical.ts` still derives `AttributeAst.definition.contextual` with a short-name regex, and the composition root still projects that boolean into inventory evidence without supplying the newly required `qualifiedIdentity` and `implementation` proof fields. The strengthened contract therefore exposes the precise upstream/producer mismatch instead of hiding it. The next phase must first adapt the existing AST evidence and `PhpClassNameResolutionRuleInterface` to produce the proof, then wire that closed judgment into the existing inventory. Runtime semantic classification is not considered migrated.

No imports from `semantic/foundation` or `semantic/relations` were added to the upstream interface. TypeScript typecheck and build were not run; only the focused static audit and audit-script syntax check were run.
