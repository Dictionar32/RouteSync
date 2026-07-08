# Changelog

All notable changes to RouteSync will be documented in this file.

## [1.0.49] - 2026-07-08

### Fixed
- **Accessor Type Resolution Pipeline** (Issues #4–#6):
  - **Kernel Graph Sync**: Resolved accessors are now synced back to the kernel's internal model graph after `resolveManifestIncrementally` completes the accessor resolution phase, preventing stale graph data when resolving resource fields.
  - **AccessorResolver Short-Circuit**: `AccessorResolver` now detects already-resolved `expression` objects and returns them directly instead of re-resolving. Added `typeof === 'object'` guard before `in` operator to prevent runtime crash on string values (e.g. `"$this->foo"`).
  - **snake_case → camelCase Fallback**: `ModelColumnResolver` now performs a fallback conversion from snake_case to camelCase when looking up accessors, matching Laravel's convention where accessors are stored as camelCase (`providerTxnId`) but referenced via snake_case (`$this->provider_txn_id`).
  - **Type Safety**: Extended `ModelAccessor` interface with `parsed_ast` and `expression_code` fields. Replaced `any` usage with proper union types and type guards across `AccessorResolver` and `incremental.ts`.

## [1.0.48] - 2026-07-06

### Added
- **Domain-Oriented Intent Patterns (Cart Actions)**:
  - Added support for compiler-generated domain helpers in `hooks.ts` when a group has a `domains` mapping configuration in `routesync.manifest.json`.
  - Automatically generates zero-boilerplate actions such as `.inc(id)`, `.dec(id)`, `.remove(id)`, `.add(id, qty)`, `.applyPromo(code)`, and `.removePromo()`.
- **Global Toast Notifications**:
  - Added a global `toast` config option inside `createClient`. Mutations (create, update, delete) automatically trigger toast callbacks (`toast.success` / `toast.error`) based on action conventions.
- **Unified Query Hook Direct Properties**:
  - React Query hooks now automatically unpack the main data property (matching the resource/group name) alongside query states (`isLoading`, `error`) at the top-level of the returned object (e.g. `const { cart, isLoading } = useCart()`).
  - Supported on both unified group hooks and explicit/canonical query hooks (e.g. `useCart.index()`).
- **Route URL Helper Background Generation**:
  - The URL helper generator output (`routes.ts`) is now written directly into the package dependencies folder and can be imported as `import { routes } from 'routesync/routes'`.
- **Consolidated Constants & Enums**:
  - Created a single source of truth for all generated constants (`API_URL`, `API_ENDPOINTS`, `ROUTES`) and status enums (`Enums`) in a centralized `constants.ts` file, preventing redundancies and desync issues.

### Fixed
- **Rules of Hooks violations**:
  - React Query mutation hooks and `useQueryClient` instances are now strictly invoked at the top-level of React hooks.
- **Strict Type Safety**:
  - Eliminated all instances of `any` from `@routesync/react` runtime libraries.
- **Flattened Relational Property Mapping**:
  - Fixed camelCase flattened properties naming conversions to resolve nested model structures (e.g. `item.produkNama` instead of `item.produk?.nama`).
