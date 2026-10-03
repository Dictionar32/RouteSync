# Phase 607 — Scanner Descriptor Relational Cutover

Phase 607 continues the scanner/lexer constructor-authority removal from Phase 606.

## Scope

The following descriptor surfaces are now immutable structural witnesses exposed through value catalogs rather than classes with constructors:

- `ScannedResourceFieldDescriptor`
- `ScannedResourceDescriptor`
- `ScannedRequestTypeDescriptor`
- `ScannedFormActionDescriptor`
- `ScannedFormFieldDescriptor`
- `ScannedControllerActionDescriptor`

The public value names are retained for compatibility, but the implementation authority is structural projection + immutable catalog.

## Semantic model

```text
scanner evidence
  -> descriptor relation
  -> structural witness
  -> immutable catalog
  -> resolver / semantic IR
```

No descriptor in this frontier uses host-language constructor allocation.

The transformation follows the declarative pattern/rewrite direction used by MLIR PDL/PDLL: matching and transformation are represented at a higher semantic level rather than encoded as handwritten constructor classes.

## Hygiene

No zero-byte production TypeScript files were found. No file was emptied merely because it looked obsolete; deletion/emptying requires an actual absence of consumers.

## Validation

All modified files transpile with TypeScript syntax diagnostics = 0.

Repository `tsc --noEmit --skipLibCheck` remains blocked before project checking by missing environment type definitions for `node` and `vitest/globals`.
