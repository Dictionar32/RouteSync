# Phase2462 — Model Accessor/Cast Operation Boundary

The scanner now consumes typed accessor and cast derivation operations instead of the former model subscanner parser modules. Existing upstream output ADTs remain canonical. The new operation interfaces are deliberately scanner-local for now because their input types are compiler-owned lexer AST types; relocating them to upstream before introducing upstream-owned source-evidence contracts would create a dependency inversion.

Direct `semantic/relations` / `semantic/foundation` imports were removed from the two derivation files. Nine model helper files still import `semantic/relations` directly, and the broader scanner directory still has 140 files with direct relation/foundation imports. Transitive dependencies through the existing Eloquent cast mapper and PHP expression semantic authority remain open and must be addressed at those authorities, not hidden by adapters.
