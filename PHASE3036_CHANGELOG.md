# Phase 3036 Changelog

- Added typed semantic object-identity pair operations in the upstream identity contract.
- Migrated alias-pair matching, evidence matching, and alias deduplication away from serialized pair keys.
- Routed same-identity seeding through canonical `semanticKnowledgeIdOperations.same`.
- Added static audit script and audit JSON for the upstream → CLI → manifest runtime trace.
- Kept relation-solver text atom conversion explicit as a legacy adapter boundary; no global primitive-elimination claim is made.
- Preserved deleted relation-foundation modules and the one-newline `collections.ts` sentinel.
