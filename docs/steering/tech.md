# RouteSync: Tech Stack & Build System

## Tech Stack

### Core Technologies
- **Language:** TypeScript (v5.4+, strict mode required)
- **Runtime:** Node.js 20+
- **Package Manager:** npm 10.8+

### Key Dependencies

**Code Generation:**
- `zod` (v4.4+): Runtime schema validation and TypeScript type inference
- `fs-extra`: Enhanced file system operations

**CLI & Build:**
- `tsup` (v8+): TypeScript bundler (all packages compiled to CommonJS + ESM)
- `turbo` (v2.9+): Monorepo task runner
- `commander`: CLI argument parsing
- `chalk` (v5.3+): Terminal color output
- `ora`: CLI spinner/progress indicators

**Framework Integrations:**
- `@tanstack/react-query` (v5+): React data fetching
- `@tanstack/vue-query` (v5+): Vue data fetching
- `react-hook-form` + `@hookform/resolvers`: React form handling
- `vee-validate` + `@vee-validate/zod`: Vue form handling

**Testing:**
- `vitest` (v4.1+): TypeScript-first test framework
- Runs in Node environment
- Tests must be named `*.test.ts` or `*.integration.test.ts`

## Project Structure

```
RouteSync/
├── packages/
│   ├── cli/              # Generator pipeline + CLI commands
│   │   └── src/
│   │       ├── commands/
│   │       ├── generators/      # Core generator classes
│   │       ├── parsers/
│   │       ├── resolvers/
│   │       └── utils/
│   ├── core/             # Shared types and utilities
│   ├── react/            # React Query integration
│   ├── vue/              # Vue Query integration
│   └── sdk/              # API client library
├── tsconfig.json         # Root TypeScript config (strict mode)
├── vitest.config.ts      # Test runner config
├── tsup.config.ts        # Build bundler config
└── turbo.json            # Monorepo pipeline config
```

## Build & Commands

### Development

```bash
# Install dependencies
npm install

# Run in watch mode (all packages)
npm run dev

# Build once (all packages)
npm run build

# Clean dist folders
npm run clean
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific package
cd packages/cli && npm test

# Watch mode (requires manual `--watch` flag)
npm run test:watch
```

### Linting

```bash
# Lint all packages
npm run lint
```

## Build Output

**Target:** ES2020, ESNext modules (transpiled to CommonJS + ESM)

**Generated Files:**
- `dist/sdk.js` / `dist/sdk.mjs` - Main SDK export
- `dist/cli.js` - CLI executable
- `dist/core.d.ts` - Type definitions (all packages)

**Monorepo Management:**
- Uses Turbo for task scheduling
- Each package builds independently
- Path aliases configured in tsconfig.json (e.g., `@routesync/core`)

## Key Configuration Files

### tsconfig.json
- Strict mode enabled (`"strict": true`)
- Module resolution: Bundler
- Target: ES2020
- Path aliases for internal packages

### vitest.config.ts
- Environment: Node
- Global test utilities enabled
- Timeout: 30 seconds per test
- Pattern: `**/*.test.ts`, `**/*.integration.test.ts`

### tsup.config.ts
- Handles building multiple entry points
- Generates both CommonJS and ESM
- Outputs TypeScript declarations

## Common Development Tasks

| Task | Command | Notes |
|------|---------|-------|
| Build all | `npm run build` | Creates dist/ in all packages |
| Watch mode | `npm run dev` | Rebuilds on file changes |
| Test all | `npm test` | Runs via Turbo in all packages |
| Test one package | `cd packages/cli && npm test` | Direct Vitest execution |
| Type check | `npx tsc --noEmit` | Check types without emit |
| Clean build | `npm run clean && npm run build` | Full rebuild |

## Important Notes

- **TypeScript Strict Mode:** All code must compile in strict mode (no `any` implicit)
- **Monorepo:** Changes to shared packages (`core`) affect all dependent packages
- **Build System:** Turbo runs tasks in dependency order; check tasks don't fail
- **Test Environment:** Tests run in Node.js environment (no DOM, no browser APIs)
- **Module Exports:** All packages follow "exports" map in package.json for different environments

## Dependencies for Common Tasks

- **Generating output:** Requires running Laravel app + manifest file
- **Type inference:** Depends on manifest metadata accuracy
- **Running CLI:** Binary at `./dist/cli.js` after build
