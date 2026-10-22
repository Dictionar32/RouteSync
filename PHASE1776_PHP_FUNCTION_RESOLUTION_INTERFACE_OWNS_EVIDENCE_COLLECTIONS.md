# Phase 1776 — Interface First: Remove Relation-Algebra Ownership From PHP Resolution Contract

The PHP function resolution interface must describe PHP source semantics, not import generic collection machinery from `semantic/relations`. The contract now owns the types of its import and declaration inventories directly through readonly collections of `PhpFunctionImportBinding` and `PhpDeclaredFunctionSymbol`.

This is a boundary correction, not a declaration that relation modules are already removable repository-wide. Existing scanner and authority implementation dependencies remain migration work. Keep the sequence: strengthen upstream domain interfaces, migrate implementations to those contracts, integrate the invocation judgment into the Laravel scanner's actual response path, then remove legacy subscanners and obsolete semantic modules only after reference audits pass.
