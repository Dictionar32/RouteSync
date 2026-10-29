# Phase 3056 changelog

- Added typed `continue | blocked` semantic continuation ADT in `core/src/types/upstream`.
- Added interface-typed domain operation and exported it from the upstream barrel.
- Exposed typed continuation through the PHP AST compatibility facade.
- Preserved model identity and all typed violations in the blocked outcome.
- Retained legacy throwing continuation only for the existing graph-returning producer contract; migrating that contract through controller/CLI is still outstanding.
- Added a dedicated structural audit and package script.
