# Phase 2012 — Framework Version Compatibility Judgment, Interface First

## Trace finding

Phase 2011 acquired `composer.lock` and classified the Laravel major version inside `responseScanner.ts`. That made the scanner both an evidence reader and the semantic compatibility owner. The compatibility rule therefore existed in a scanner helper rather than in the upstream contract that controls whether the pagination metadata profile may be proven.

## Contract-first change

The existing `LaravelControllerPaginationMetadataProfileInterface` now owns `frameworkVersionCompatibility: LaravelFrameworkVersionCompatibilityJudgmentInterface`. This is a subordinate judgment within the existing metadata-profile contract, not a parallel response authority.

The scanner only acquires lock-file facts as `LaravelFrameworkVersionLockEvidence`:

- `laravel_framework_lock_unavailable`
- `laravel_framework_lock_invalid`
- `laravel_framework_package_not_locked`
- `laravel_framework_version_candidate`

The upstream compatibility judgment interprets those facts. Only a recognized stable semantic version with major `12` is admitted by the currently verified default pagination metadata contract. Missing, malformed, prerelease/non-standard, and unsupported versions remain unresolved.

## Integrated flow

`composer.lock facts → LaravelFrameworkVersionLockEvidence → existing metadata profile's framework-version judgment → pagination metadata profile → pagination envelope judgment → output-type judgment → ResponseDefinition / ResponseAst`

The original lock-file source identity and exact version evidence are retained in the proven judgment. The scanner no longer contains a semver regex or a branch deciding which framework major is compatible.

## Boundaries

- No `relation` or `foundation` subscanner is added.
- No response authority is duplicated.
- Canonical `ResponseResult`, resolved `ResourceDefinition`, and the existing AST projection path remain the semantic inputs.
- Laravel 10, 11, 13, dev branch versions, and prerelease versions are not claimed compatible by this contract.
- This phase does not claim a full-project typecheck or build pass.

## Official references

- Laravel 12 API: `PaginatedResourceResponse` documents `paginationInformation`, `paginationLinks`, and `meta`: https://api.laravel.com/docs/12.x/Illuminate/Http/Resources/Json/PaginatedResourceResponse.html
- Laravel Eloquent API Resources documents pagination customization: https://laravel.com/docs/12.x/eloquent-resources
- TypeScript Handbook documents discriminated unions and narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
