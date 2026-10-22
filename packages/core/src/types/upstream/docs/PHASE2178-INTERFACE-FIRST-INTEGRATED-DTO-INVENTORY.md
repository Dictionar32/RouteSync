# Phase 2178 — Interface-First Integrated DTO Inventory

## Scope

This phase propagates the existing closed DTO discovery inventory across the integrated-response interface. It does not introduce a `relation` or `foundation` layer, a new subscanner, or a second invocation authority.

## Changes

1. `LaravelControllerResponseIntegratedJudgmentInput` now requires `dtoDeclarationInventory`, narrowed to the complete member of `LaravelProjectDtoDeclarationInventoryInterface`. A caller can no longer present `readonly DtoAst[]` as proof that discovery completed.
2. `LaravelControllerScannerExecutor` passes the closed inventory directly to `judgeIntegratedResponse`, rather than projecting it into a raw array at the call site.
3. The existing response pipeline performs the compatibility projection from receipt declarations to `DtoAst[]` only at the legacy evidence-production boundary. This keeps the public integrated boundary receipt-first while avoiding an untruthful claim that the downstream evidence producer has already migrated.
4. The response pipeline contract version advances from 19 to 20.
5. The scanner implementation version is corrected from 33 to 34 to match `LaravelControllerScannerInterface` and its emitted judgments. This mismatch was present in the Phase 2177 archive.

## Trace outcome

- **Closed inventory → controller scanner interface:** connected.
- **Controller scanner → integrated response interface:** connected using the closed inventory.
- **Integrated response → legacy evidence producer:** a compatibility projection remains.
- **PHP class-name authority → DTO declaration judgment:** not yet connected. `scanDtoDeclarationInventory` still marks lexical class identities unresolved because namespace/import context has not been supplied to the existing `PhpClassNameResolutionRuleInterface`.
- **Invocation semantic judgment:** existing invocation authority remains the owner. No parallel invocation judgment was added.
- **Runtime executor:** invocation executor continues to delegate directly to `authority.analyze(input)`; response executor remains the existing response authority projection. Neither executor is granted semantic classification responsibility.

## Why this is the correct interface boundary

A closed discovery receipt proves that the declared scan scope was considered; it does not prove every discovered class name is semantically resolved. The contract deliberately preserves that distinction. The next change must connect the existing PHP name-resolution authority and DTO declaration judgment, then migrate the evidence producer from the legacy AST array to the closed judgment without reclassifying DTO names in the scanner.

## Verification

Static source checks confirmed that the integrated input field, call site, pipeline projection, contract version, and scanner implementation version agree. ZIP integrity was checked. No build, TypeScript typecheck, or full test suite was run.
