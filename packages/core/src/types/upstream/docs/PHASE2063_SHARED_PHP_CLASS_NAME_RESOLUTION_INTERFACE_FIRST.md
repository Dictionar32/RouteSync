# Phase 2063 — Shared PHP Class-Name Resolution, Interface First

## Trace finding

Phase 2062 had correct class-reference behavior in two separate places: the inheritance path in `controllerDeclarationParser.ts` and the static-call origin authority. Both consumed the same lexical facts but independently interpreted namespace-relative names, aliases, and incomplete import inventory. That was duplicated semantic ownership, not just duplicated syntax.

## Change

- Added `PhpClassNameResolutionContext`, `PhpClassNameResolutionInput`, and `PhpClassNameResolutionRuleInterface` to the existing upstream PHP class-name contract.
- Added one `phpClassNameResolutionAuthority` that closes the result as the existing `PhpClassNameResolution` ADT.
- Controller inheritance now adapts source spelling plus its lexical namespace/import evidence into that contract.
- Static-call origin resolution delegates to the same authority before facade/model identity matching; it no longer reimplements namespace/import semantics.
- Advanced the existing static-call origin authority contract to version 8 to record the changed semantic dependency.
- Added regression coverage for FQCN, class aliases, nested alias paths, namespace-relative names, current namespace, and incomplete import evidence.

## Architecture boundaries

`source tokens → lexical evidence → PhpClassNameResolutionInput → closed PhpClassNameResolution ADT → declaration/static-call consumers`.

The scanner is an evidence adapter. The upstream authority owns class-name semantics. The invocation semantic judgment, integrated response authority, AST/ADT pipeline, and runtime executor remain existing authorities and are not duplicated. No `relation/foundation` subscanner was added.

## Verification scope

The phase audit checks the contract and wiring statically. Full build, full TypeScript typecheck, and Vitest are not claimed as run in this environment.

## Reference basis

PHP's official name-resolution rules distinguish fully-qualified, namespace-relative, imported, and current-namespace class names. MLIR's official interface documentation describes interfaces as the mechanism that lets analyses operate on semantic contracts rather than special-casing concrete operation types.
