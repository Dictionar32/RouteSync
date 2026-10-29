# Phase 3037 changelog

- Replaced the object-identity authority's generic relation-solver calls with a domain-owned finite-evidence ADT.
- Removed `knowledgeIdKey`, relation atom conversions, generic solver imports, and solver closure branches from the object-identity runtime consumer.
- Added typed proof facts and derivations for assignment-reference evidence, identity links, and alias answers.
- Preserved multiple assignment evidence entries when deduplicating unordered alias pairs.
- Converted analysis and alias entry points to interface-backed operation objects and updated the PHP route-AST compatibility consumer.
- Added Phase 3037 regression coverage and a static audit.
- Kept all previously deleted generic relation foundation modules absent and preserved the one-byte `collections.ts` sentinel.
