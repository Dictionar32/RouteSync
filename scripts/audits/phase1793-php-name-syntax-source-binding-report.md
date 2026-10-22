# Phase 1793 — PHP Name-Syntax Source Binding

## Trace finding

The existing `PhpFunctionNameResolutionAuthority` checked that invocation and name-syntax spans belonged to the same file and lexical namespace region. It did not require the name-syntax span to be contained within the invocation's own source span. A forged or mismatched syntax span elsewhere in the same file/region could therefore pass that part of the source-binding check.

## Interface-first correction

- Evolved `PHP_FUNCTION_NAME_RESOLUTION_CONTRACT` from version 6 to version 7.
- Added the ordered rule `require-name-syntax-evidence-to-be-contained-by-invocation-source-span`.
- Added the `syntaxContainment` contract clause requiring non-empty name-syntax spans contained by the invocation span.
- Strengthened the existing name-resolution authority to require a valid non-empty invocation span, a valid non-empty primary syntax span, containment of the primary syntax span within the invocation span, and containment of every name segment within that span.
- Kept namespace-region binding as a separate obligation, so same-call containment does not replace lexical-scope validation.
- Preserved existing invocation semantic judgment and integrated response contracts. The Laravel scanner still receives the integration state from the composition root; pending remains explicit because whole-file PHP inventory is not yet wired.

## Validation

`audit-phase1793-php-name-syntax-source-binding.cjs` checks contract/type synchronization and source containment obligations. The Phase 1793 audit passed 15/15. Re-running the selected Phase 1792, 1791, and 1788 static audits also passed (22/22, 20/20, and 13/13), for 70/70 checks across these four audit scripts. This is static validation, not a TypeScript build or end-to-end parser test. Full build/typecheck was not run.

## External references

- PHP Manual, namespace definition and lexical namespace constructs: https://www.php.net/namespaces.definition
- PHP Manual, aliasing/importing rules: https://www.php.net/language.namespaces.importing.php
- PHP language specification, namespace imports and aliases: https://phplang.org/spec/18-namespaces.html
- nikic/PHP-Parser NameResolver documentation: https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown
