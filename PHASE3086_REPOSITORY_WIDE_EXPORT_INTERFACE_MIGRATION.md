# Phase 3086 — Repository-wide Export Interface Migration

## Intent

Apply the `export const operation: DomainInterface = Object.freeze({ ... })` convention to exported operations, and make upstream own the knowledge needed to continue a runtime result. This phase performs a concrete first migration and establishes an exhaustive source inventory for the remaining repository-wide work.

## Concrete migration applied

The shared PHP class-name constructor was changed from a standalone exported arrow function to an explicit upstream operation object:

- Source: `packages/core/src/types/upstream/phpClassNameResolutionInterface.ts`
- Contract: `PhpQualifiedClassNameFactoryInterface`
- Runtime operation: `phpQualifiedClassNameFactory.create(value)`
- The factory object is frozen.
- All direct consumers in `packages/**` were migrated from function-call syntax to `.create(...)`.
- The root core export now exports the factory object, not the former callable function.

The transformation preserves the normalization rule that removes leading PHP namespace separators and returns the same `PhpQualifiedClassName` domain value. The consumer migration is explicit, rather than hiding the old callable behind a wrapper.

## Runtime trace

```text
PHP/Laravel source discovery
  -> controller declaration / model scanner / DTO canonicalization
  -> phpQualifiedClassNameFactory.create(...)
  -> PhpQualifiedClassName domain value
  -> class-name resolution context and authority
  -> semantic invocation analysis
  -> manifest composition and validation
  -> canonical manifest JSON
  -> generator persistence
```

This factory is a low-level upstream value-construction operation within the larger scanner-to-manifest path. It does not replace or duplicate the source identity, source-read, semantic invocation, or manifest authorities.

## Repository-wide inventory

Scope: every `.ts` and `.tsx` source file under `packages/` (2,382 source files scanned).

| Package | `export function` declarations | `export const name = (...) => ...` declarations | Candidate files |
|---|---:|---:|---:|
| `core` | 470 | 319 | 300 |
| `react` | 30 | 16 | 23 |
| `sdk` | 20 | 0 | 11 |
| **Total** | **520** | **335** | **334** |

There are **855 declarations remaining in the two requested syntactic categories** after this phase. They are enumerated by file and line in `PHASE3086_REPOSITORY_WIDE_EXPORT_INTERFACE_MIGRATION_INVENTORY.json`.

This phase does **not** claim that all 855 declarations have been converted. A repository-wide object conversion is an API migration: direct calls, recursive calls, callback references, imports/re-exports, `Parameters<typeof operation>`, overloads, and consumers must be migrated together. Replacing syntax alone would break runtime behavior or erase type information. The inventory gives a concrete, auditable backlog rather than pretending a mechanical replacement is safe.

## Verification

The Phase 3086 audit checks:

- explicit factory interface exists;
- exported operation is an interface-typed object;
- operation exposes a domain-owned `create` operation;
- all direct consumers use `.create(...)`;
- TypeScript syntax transpilation is clean for files referencing the migrated operation;
- a runtime smoke test verifies the PHP qualified-name normalization result;
- the old helper name is absent from package sources;
- removed relation foundation files are not restored;
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.

Audit command:

```bash
npm run audit:phase3086-repository-wide-export-interface-migration
```

Syntax transpilation and a focused runtime smoke test are not equivalent to strict project type-checking or the complete PHP → CLI → manifest → generator end-to-end test. The full type-check attempt still reports existing workspace problems, including missing relation-foundation imports and `collections.ts` being intentionally empty. Those blockers are recorded, not silently repaired by recreating the forbidden relation foundation.

## PHP and Laravel references

- PHP object interfaces describe contracts of operations and their public surface: https://www.php.net/manual/en/language.oop5.interfaces.php
- PHP type declarations document typed function boundaries and compatibility: https://www.php.net/manual/en/language.types.declarations.php
- Laravel controllers document how route declarations dispatch to controller operations: https://laravel.com/framework/docs/12.x/controllers

These are source-language/runtime references. The TypeScript interface-first convention here is a RouteSync architectural choice inspired by explicit operation contracts, not a claim that PHP interfaces and TypeScript object types are identical constructs.
