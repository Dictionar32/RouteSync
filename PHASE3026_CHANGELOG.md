# Phase 3026 Changelog

- Added `SourceSpanOperationsInterface` and interface-backed `sourceSpanOperations` with closed judgments for equality, bounds validity, containment, and document coverage.
- Added `SourceSpanFactoryInterface` and `sourceSpanFactory`.
- Migrated the CLI PHP source adapter and controller dataflow source-payload adapter to the shared span factory.
- Migrated source frontend validation and PHP function-resolution source inventory to the central span operations.
- Added Phase 3026 tests and a static audit script/package command.
- Preserved the deleted relation-foundation invariant and the `collections.ts` sentinel.
- Full typecheck and runtime tests remain unverified because dependencies are not installed in this workspace.
