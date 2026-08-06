# RouteSync: Project Structure & Organization

## Directory Organization

### Root Level

```
RouteSync/
├── packages/              # Monorepo packages (5 main packages)
├── docs/                  # Documentation files
├── examples/              # Example manifests and usage
├── compiler/              # Compiler-related utilities (legacy/exploratory)
├── src/                   # Legacy code (being migrated to packages/)
├── .kiro/                 # Kiro agent configuration
│   └── steering/          # Steering rules for AI agents
├── tsconfig.json          # Root TypeScript configuration
├── package.json           # Root package.json with workspaces definition
├── vitest.config.ts       # Test runner configuration
├── tsup.config.ts         # Build bundler configuration
└── turbo.json             # Monorepo task orchestration
```

### Packages Structure (Main Codebase)

#### `packages/cli/` - Command Line Interface & Generators

**Core responsibility:** Parse manifests, run semantic analysis, generate code

```
packages/cli/
├── src/
│   ├── commands/          # CLI command implementations
│   │   ├── sync.ts        # Main sync command (entry point)
│   │   └── ...
│   ├── generators/        # Code generator classes (core logic)
│   │   ├── ZodTierGenerator.ts        # Generates Zod schemas + TypeScript types + mappers
│   │   ├── HookGenerator.ts           # Generates React/Vue hooks
│   │   ├── SDKGenerator.ts            # Generates API SDK
│   │   ├── TypeGenerator.ts           # Generates TypeScript types
│   │   ├── QueryKeyGenerator.ts       # Generates TanStack Query keys
│   │   ├── ConstantsGenerator.ts      # Generates API constants
│   │   ├── ModelGenerator.ts          # Generates model types
│   │   ├── canonical-names.ts         # Centralized naming conventions
│   │   ├── normalizer.ts              # Normalizes manifest to IR
│   │   ├── pipeline.ts                # Generator pipeline orchestration
│   │   └── __tests__/
│   │       ├── *.test.ts              # Unit tests
│   │       └── *.integration.test.ts  # Integration tests
│   ├── parsers/           # Manifest parser logic
│   │   └── ...
│   ├── resolvers/         # Type resolution and semantic analysis
│   │   └── ...
│   ├── utils/             # Shared utilities
│   │   └── ...
│   └── index.ts           # CLI entry point
├── package.json           # Package configuration
└── tsconfig.json          # Package-specific TypeScript config
```

**Key Generators:**
- **ZodTierGenerator** (1890 lines): Largest generator, produces contract/schema/field/read/form/mapper layers
- **HookGenerator**: React Query and Vue Query integration
- **SDKGenerator**: Typed API client
- **Others**: Type, QueryKey, Constants, Model generators (simpler, more focused)

#### `packages/core/` - Shared Types & Utilities

```
packages/core/
├── src/
│   ├── types/             # Shared type definitions
│   ├── utils/             # Shared utility functions
│   └── index.ts
└── package.json
```

Used by all other packages for common interfaces and helpers.

#### `packages/react/` - React Integration

```
packages/react/
├── src/
│   ├── hooks/             # React hooks for TanStack Query
│   ├── components/        # React components (if any)
│   └── index.ts
└── package.json
```

Provides React Query hooks that consume generated API client.

#### `packages/vue/` - Vue Integration

```
packages/vue/
├── src/
│   ├── composables/       # Vue composables for TanStack Query
│   └── index.ts
└── package.json
```

Provides Vue Query composables that consume generated API client.

#### `packages/sdk/` - SDK Package

```
packages/sdk/
├── src/
│   ├── index.ts           # Main SDK export
│   └── ...
└── package.json
```

Core API client library that others depend on.

## Code Generation Output Structure

When `routesync sync` runs, generated files are placed in the frontend project:

```
src/api/
├── contract/              # Generated from ZodTierGenerator.generateContract()
│   ├── api-contract.ts    # Zod schemas for backend response contracts
│   ├── api-schema.ts      # Form validation schemas
│   └── api-field.ts       # Field name mappings (snake_case ↔ camelCase)
├── types/
│   ├── index.ts           # Generated from TypeGenerator (barrel export)
│   ├── api-read.ts        # Generated from ZodTierGenerator.generateRead() (camelCase types)
│   └── api-form.ts        # Generated from ZodTierGenerator.generateForm() (form shapes)
├── mappers/
│   └── api-mapper.ts      # Generated from ZodTierGenerator.generateMapper() (transform functions)
├── api.ts                 # Generated from SDKGenerator (API client)
├── hooks.ts               # Generated from HookGenerator (React/Vue hooks)
├── query-key.ts           # Generated from QueryKeyGenerator (TanStack Query keys)
└── constants.ts           # Generated from ConstantsGenerator (API constants)
```

## Generator Invocation Pipeline

In `packages/cli/src/commands/sync.ts`:

1. **Parse manifest** from JSON file
2. **Normalize manifest** via semantic analysis (creates intermediate representation)
3. **Invoke each generator independently:**
   - ZodTierGenerator (produces 6 output files)
   - HookGenerator
   - SDKGenerator
   - TypeGenerator
   - QueryKeyGenerator
   - ConstantsGenerator
   - ModelGenerator
4. **Write all generated files** to output directory

**Current Issue:** Each generator re-derives semantic decisions independently (no shared IR)

## Testing Organization

Test files are located adjacent to source files:

```
packages/cli/src/generators/
├── ZodTierGenerator.ts
├── __tests__/
│   ├── ZodTierGenerator.test.ts        # Unit tests
│   └── emitters.integration.test.ts    # Integration tests
├── HookGenerator.ts
├── __tests__/
│   └── HookGenerator.test.ts           # Unit tests
└── ...
```

**Test Patterns:**
- Unit tests: Test individual methods/functions in isolation
- Integration tests: Test multiple generators together with real manifests
- Real-world examples: Use actual order/item/category models from examples/

## Monorepo Task Orchestration

The `turbo.json` defines task dependencies:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],           // Depends on dependencies building first
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],           // Tests need build to complete
      "inputs": ["src/**/*.ts"]
    }
  }
}
```

Turbo runs tasks in optimal order across all packages.

## Important Conventions

### Naming

- **Generators:** `*Generator.ts` (e.g., `ZodTierGenerator.ts`)
- **Generated output:** `api-*.ts` (e.g., `api-schema.ts`, `api-mapper.ts`)
- **Tests:** `*.test.ts` (unit), `*.integration.test.ts` (integration)
- **Types:** `*Type.ts` or `interface/type` definitions in `types/` folder

### Code Organization

- **Generators:** Single class per file, static methods for generation logic
- **Utilities:** Pure functions in `utils/` with no side effects
- **Types:** Shared types in `core/` package, generator-specific types colocated
- **State Management:** Minimize mutable state (current issue with `ZodTierGenerator.knownSchemas`)

### Import Paths

Use path aliases defined in tsconfig.json:

```typescript
import { CoreType } from '@routesync/core'    // Instead of relative ../../../
```

## Architecture Refactoring Notes

Currently undergoing refactoring to:
1. Establish **single Intermediate Representation (IR)** consumed by all generators
2. **Centralize duplicate logic** (ACTION_MAP appears 6x, should be 1)
3. **Eliminate mutable state** (knownSchemas class-static field)
4. **Separate concerns** (ZodTierGenerator doing 6 jobs should split into modules)

The refactoring is documented in detailed implementation roadmaps and phase-by-phase guides in the repository root.

## File Patterns to Know

| Pattern | Meaning | Example |
|---------|---------|---------|
| `*.test.ts` | Unit test | `ZodTierGenerator.test.ts` |
| `*.integration.test.ts` | Integration test | `emitters.integration.test.ts` |
| `api-*.ts` | Generated output | `api-schema.ts`, `api-mapper.ts` |
| `*Generator.ts` | Code generator | `ZodTierGenerator.ts` |
| `routesync.manifest.json` | Input artifact | Configuration of routes/models |
| `routesync.ir.json` | Intermediate representation | Normalized semantic data |
| `routesync.graph.json` | Graph visualization | For architecture understanding |
