# Phase 574 — Build Trace Validation Descriptor Export Closure

## Target
Close the current DTS build blocker reported by `build(2).log`:

- `validationDescriptors.ts` did not export `RouteSemanticFlowValidationRuleSet`.
- `validationDescriptors.ts` imported `RouteValidationRuleSet` only as a type.
- `descriptors/index.ts` already expected both names from `validationDescriptors`.

## Fix
The canonical `RouteSemanticFlowValidationRuleSet` implementation remains in:
`compiler/scanner/descriptors/validation/validationRuleSet.ts`.

`validationDescriptors.ts` now imports the class as a value and explicitly re-exports it. No duplicate implementation or compatibility wrapper was introduced.

## Verification
- Source-level export/import closure inspected.
- `descriptors/validation/index.ts` already exports both canonical symbols.
- `descriptors/index.ts` now resolves both requested symbols through `validationDescriptors.ts`.

The checkpoint environment does not contain `node_modules`, so a full `npm run build` cannot be executed locally in this extracted checkpoint. The fix targets the exact DTS errors reported by the supplied build trace.
