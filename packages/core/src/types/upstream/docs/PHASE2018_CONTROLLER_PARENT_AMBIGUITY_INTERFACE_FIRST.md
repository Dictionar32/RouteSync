# Phase 2018 — Controller Parent Ambiguity Interface First

## Trace

`ControllerDeclarationSemanticCandidate.parent` carries a `ControllerName`, while the source parser currently provides only the short parent identifier. The previous authority used `inventory.find(...)`, which silently selected the first same-name parent candidate. That is not a closed semantic judgment when multiple source files declare that name.

## Contract-first change

The existing `ControllerDeclarationAncestryTermination` ADT now includes `parent_ambiguous_in_inventory`, carrying the requested parent identity and all candidate `SourceFile` identities. The existing declaration authority returns this outcome when more than one inventory candidate matches. It does not guess, pick the first declaration, or add a second authority. Existing selection ADT therefore classifies the result as blocked.

The public Laravel controller scanner contract and its executor are advanced together to contract version 25. The existing blocker propagation already accepts the full ancestry termination ADT, so it carries this new outcome without a separate relation/foundation subscanner.

## Scope boundary

This phase does not claim that PHP namespace/import resolution is complete. It prevents unsafe short-name resolution when the inventory is ambiguous. The next interface-first step should model PHP fully-qualified class identity and import/name-resolution evidence in the existing declaration contract before attempting exact parent resolution.

The scanner tree has no `subscanners/relation` or `subscanners/foundation` directory. However, `semantic/relations` utility imports still exist in scanner implementation files; this phase does not claim to remove those utilities or all their consumers.

## Verification

Run `node scripts/audits/audit-phase2018-controller-parent-ambiguity-interface-first.cjs`. This audit checks contract ownership, ambiguity handling, source provenance, blocker propagation, version agreement, and absence of the named subscanner directories. Full TypeScript typecheck/build is not implied by this structural audit.
