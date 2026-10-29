# Phase 3029 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope: upstream PHP function-name resolution

This phase continues the actual `upstream → CLI → manifest` path from Phase 3028. It migrates a concrete PHP semantic consumer rather than introducing a parallel abstraction.

Runtime trace:

1. `packages/cli/src/manifestScanOperationInterface.ts` exposes the CLI manifest scan operation.
2. The CLI delegates through `ControllerInvocationManifestCompositionAuthorityInterface`.
3. Upstream PHP source evidence and the function-resolution environment reach `phpFunctionNameResolutionAuthority`.
4. `phpFunctionNameResolutionAuthority` now delegates source-span equality, non-empty validation, and containment to `sourceSpanOperations` in `packages/core/src/types/upstream/provenance.ts`.
5. The existing semantic judgment and manifest preparation path continues to preserve evidence and incomplete-environment blockers.

## Applied change

`packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts` no longer reimplements source-span equality or range containment by comparing coordinate fields directly. Its local helpers delegate to the existing domain interface:

- equality → `sourceSpanOperations.same`
- valid non-empty span → `sourceSpanOperations.validateNonEmpty`
- range containment → `sourceSpanOperations.contains`

The authority itself remains an interface-backed exported object:

`export const phpFunctionNameResolutionAuthority: PhpFunctionNameResolutionAuthorityInterface = Object.freeze({...})`.

This keeps semantic knowledge in the upstream ADT and prevents consumers from creating a second implementation of source-span meaning. The closed judgments still have to be interpreted at the consumer boundary; parser-level offsets remain a representation boundary, not the source of domain policy.

## Audit

Run:

```sh
npm run audit:phase3029-php-function-name-source-span-domain-operations
```

The audit verifies the selected consumer delegates to canonical span operations, the CLI and composition entry points remain in the trace, the removed relation-foundation files remain absent, and `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.

## Explicit non-claims / remaining debt

- This is a scoped static contract audit, not proof of full runtime correctness.
- Source offsets still use `NumberValue` at the parser boundary. The next model should make source positions meaningful through domain operations; wrapping `number` alone is not enough.
- Other consumers still contain coordinate comparisons or direct construction sites and must be migrated in separate, type-verified slices.
- `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, empty arrays, `??`, ternaries, and exported-function patterns have **not** been globally eliminated. Mechanical global rewriting would risk erasing PHP syntax evidence, source identity, and blocker information.
- TypeScript compilation, full Vitest, and CLI-to-manifest end-to-end verification are not claimed as passed in this environment.

## Design references

TypeScript interfaces can define explicit structural contracts, and discriminated unions can preserve distinct outcomes. See the official [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces) and [Unions and Intersection Types](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html) documentation. For the Laravel route/controller side of the runtime path, use the official [Laravel Routing documentation](https://laravel.com/docs/routing) as the framework behavior reference; scanner evidence should be preserved rather than replaced with guessed route/controller relationships.
