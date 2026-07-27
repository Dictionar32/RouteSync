# RouteSync: Product Overview

## What It Is

RouteSync is a **code generator** that transforms Laravel route definitions into **type-safe frontend SDKs**. It creates TypeScript/JavaScript client libraries from Laravel backend routes with automatic request/response validation and type inference.

## Core Purpose

- **Input:** Laravel route metadata (extracted via reflection from running Laravel app)
- **Processing:** Semantic analysis, type resolution, code generation
- **Output:** Typed SDKs (React hooks, Vue composables, plain TypeScript API clients) + validation schemas (Zod)

## Key Features

1. **Type Safety:** Automatic inference of request/response types from Laravel backends
2. **Schema Validation:** Generates Zod schemas for form validation and runtime type checking
3. **Framework Integration:** React hooks (React Query), Vue composables (Vue Query)
4. **Multiple Output Formats:** Can generate SDK, React integration, Vue integration separately
5. **Manifest-Based:** Operates on a manifest file format that captures complete route metadata

## Main Use Case

Frontend developers build fully typed API clients without manually maintaining request/response types. When backend routes change, re-run RouteSync to regenerate with new types.

## Project Structure

- **CLI Package** (`packages/cli`): Generator pipeline and command-line interface
- **Core Package** (`packages/core`): Shared type definitions and utilities
- **React Package** (`packages/react`): React Query integration
- **Vue Package** (`packages/vue`): Vue Query integration
- **SDK Package** (`packages/sdk`): Core API client library

## Current Focus

Active refactoring to consolidate generator architecture: eliminating duplicate semantic resolution logic and establishing a single intermediate representation (IR) for type decisions across all generators.
