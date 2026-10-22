# Phase 2295 — Attribute Scan Discovery Closure

## Interface-first finding

The current attribute producer calls `collectPhpFiles(app/Attributes)`. That helper maps a missing directory to an empty list, and its read/parse errors can escape as rejected promises rather than a typed scan judgment. The upstream contract's `complete` variant therefore claimed closure without representing the discovery scope or discovery failures.

## Contract changes

- Evolve the existing `LaravelAttributeScannerInterface` to contract version 13.
- Name the actual scan scope explicitly: the project-relative `app/Attributes` directory. The inventory is closed for this scope, not for the entire Laravel project.
- Add `LaravelAttributeScanDiscoveryReceipt`, which binds project, scope, deterministic scanned-file sequence, and explicit producer obligations.
- Each scanned-file entry retains source file, produced `AttributeAst`, and contextuality judgment together.
- Make the discovery receipt the source of AST products in the complete result; do not publish a parallel loose AST array.
- Add typed discovery blockers for missing root, unreadable directory, unreadable file, and declaration parse failure.
- The blocked judgment requires a non-empty union of discovery or name-resolution failures and retains the partial discovered-file sequence without publishing a complete receipt or contextual inventory.
- Scope `LaravelContextualAttributeInventory` to `app/Attributes` so an empty inventory is not mistaken for project-wide absence.

## Scope boundary

This phase changes only upstream contracts, contract documentation, trace, and structural audit. It does not modify the producer, pipeline, CLI, or runtime. The producer still needs to be migrated to the new contract; its current missing-directory and read/parse behavior is recorded as migration debt.

## Validation boundary

The phase audit checks contract shape, failure distinctions, source-project/scope binding, and the actual CLI call path. It is not a TypeScript typecheck or build. No `npm run build` was run.

## Related official references

- PHP `scandir()` documents the distinction between a successful directory listing and failure (`false`): https://www.php.net/manual/en/function.scandir.php
- PHP `file_get_contents()` documents that read failures return `false`: https://www.php.net/manual/en/function.file-get-contents.php
- PHP-Parser `NameResolver` documents namespace and alias-aware PHP name resolution: https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown
- TypeScript Handbook documents discriminated unions and narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
