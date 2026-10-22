# Phase 1787 — PHP Name Import Interface Trace

## Scope

Interface-first trace from `packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts` through `phpFunctionNameResolutionAuthority.ts`, then to the Laravel resource-expression scanner and the existing invocation integrated response. This phase changes upstream resolution contracts/authority only; scanner wiring is intentionally not migrated before the interface accurately models PHP import semantics.

## Concrete defect found

The prior contract represented `use function` imports as `PhpFunctionImportBinding`, but also applied that same import collection to the leading segment of qualified names. PHP has distinct import tables: function imports resolve an exact unqualified function name (for example `use function Vendor\\Tools\\run as execute; execute()`), while a qualified name such as `Tools\\run()` uses a namespace/class alias table (for example `use Vendor\\Tools as Tools; Tools\\run()`). Mixing these tables could incorrectly rewrite a qualified call using a function alias.

Official references:
- PHP Manual — Aliasing and Importing: https://www.php.net/language.namespaces.importing.php
- PHP Manual — Name Resolution Rules: https://www.php.net/manual/en/language.namespaces.rules.php
- PHP Manual — Fallback to Global Space: https://www.php.net/manual/en/language.namespaces.fallback.php
- TypeScript Handbook — Unions and Intersection Types: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html

## Interface changes

1. Added `PhpNamespaceImportBinding` and `PhpNamespaceImports` as distinct domain types.
2. Added `namespaceImports` to both `global_function_scope` and `namespaced_function_scope`.
3. Added `namespace-prefix-imports-inventoried` to the complete environment witness and `namespace-prefix-imports` to the incomplete-evidence obligation union.
4. Bumped `PHP_FUNCTION_NAME_RESOLUTION_CONTRACT` from version 4 to version 5.
5. Replaced the ambiguous rule `apply-qualified-import-alias-to-leading-segment-only` with `apply-namespace-prefix-import-to-qualified-leading-segment`.
6. Clarified alias identity: function imports only resolve exact unqualified function names; namespace-prefix imports rewrite the leading segment of qualified names.
7. Updated the existing resolution authority to validate namespace-import provenance and consult `namespaceImports` for qualified names. Unqualified function calls continue to consult `imports`; fully qualified names bypass import tables.

## Laravel scanner trace

`packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts` currently captures `functionNameEvidence` but `mapFunctionCall` still projects the lexical token spelling directly into a generic `call` expression. It does not supply the file-level namespace/import/declaration environment to the name-resolution authority. The existing controller integrated response still advertises PHP invocation integration as pending until that inventory is available.

No scanner wiring was changed in this phase because the source environment contract now requires a complete namespace-prefix import inventory. Migrating the scanner before that evidence is available would create a false complete environment or force semantic classification into the scanner.

## Audit

Run:

```sh
node scripts/audits/audit-phase1787-php-name-import-interface.cjs
```

Expected result: 11/11 static contract checks pass. This audit does not run TypeScript compilation or the package build.

## Remaining work

1. Extend the PHP frontend evidence model to provide namespace-prefix imports separately from `use function` imports.
2. Build a source-file-bound environment containing namespace, namespace-prefix imports, function imports, and declarations.
3. Feed each source invocation through the existing resolution authority and invocation judgment authority.
4. Close the complete source inventory into a validated batch and pass it into the existing integrated response.
5. Migrate all consumers of the resource subscanner before deleting it.
