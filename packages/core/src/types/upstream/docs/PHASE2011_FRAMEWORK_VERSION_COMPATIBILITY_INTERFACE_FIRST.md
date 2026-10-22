# Phase 2011 — Pagination Metadata Framework-Version Compatibility, Interface First

## Trace finding

Phase 2010 projected Laravel pagination metadata from `PaginationKind` under a named default-metadata profile, but the profile did not require evidence that the source project actually used the Laravel framework version for which the metadata shape had been checked. A profile label is not source-version evidence.

## Contract-first correction

The existing response output-type authority now receives `LaravelFrameworkVersionCompatibility`, a closed ADT with proven and unresolved outcomes. The existing pagination metadata profile can only produce a proven judgment when `composer.lock` contains an exact `laravel/framework` package version in the verified Laravel 12 major. Missing, invalid, unrecognized, or out-of-profile lock evidence remains unresolved.

This evidence is deliberately narrow: `composer.json` constraints are not treated as the installed version. The reader uses `composer.lock` package metadata, and it does not infer a framework version from controller syntax, route names, or the repository's own package version.

## Integrated path

`composer.lock evidence → LaravelFrameworkVersionCompatibility ADT → LaravelControllerPaginationMetadataProfileInterface → pagination envelope judgment → output-type judgment → ResponseDefinition / ResponseAst`

The existing response authority, runtime executor, resource definitions, method source provenance, and AST projection remain in place. The scanner only acquires package-lock evidence; the upstream interface owns compatibility judgment. No parallel response authority or `relation`/`foundation` subscanner was added.

## Conservative behavior

Only Laravel 12.x is currently admitted by this profile because the contract's documented shape is explicitly tied to the Laravel 12 documentation/API baseline. Other major versions remain unresolved until a separate versioned metadata contract is verified. The fallback `mixed` remains a projection fallback when the judgment is unresolved; it is not semantic proof that the response is mixed.

## Verification

The Phase 2011 structural audit checks the compatibility ADT, exact `laravel/framework` lock evidence, strict major-version gate, provenance, propagation through the existing output-type and AST projection interfaces, contract version increments, and absence of new `relation`/`foundation` subscanners. Syntax transpilation passed for the three changed TypeScript files. Full project typecheck/build is not claimed to pass.
