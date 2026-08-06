# RouteSync: Panduan Teknologi & Sistem Build

## Stack Teknologi

### Teknologi Inti
- **Bahasa:** TypeScript (v5.4+, strict mode wajib)
- **Runtime:** Node.js 20+
- **Package Manager:** npm 10.8+

### Dependensi Utama

**Code Generation:**
- `zod` (v4.4+): Validasi schema runtime dan inferensi tipe TypeScript
- `fs-extra`: Operasi file system yang ditingkatkan

**CLI & Build:**
- `tsup` (v8+): TypeScript bundler (semua package dikompilasi ke CommonJS + ESM)
- `turbo` (v2.9+): Monorepo task runner
- `commander`: CLI argument parsing
- `chalk` (v5.3+): Terminal color output
- `ora`: CLI spinner/progress indicators

**Integrasi Framework:**
- `@tanstack/react-query` (v5+): React data fetching
- `@tanstack/vue-query` (v5+): Vue data fetching
- `react-hook-form` + `@hookform/resolvers`: React form handling
- `vee-validate` + `@vee-validate/zod`: Vue form handling

**Testing:**
- `vitest` (v4.1+): TypeScript-first test framework
- Berjalan di environment Node
- Test harus dinamai `*.test.ts` atau `*.integration.test.ts`

## Struktur Proyek

```
RouteSync/
├── packages/
│   ├── cli/              # @routesync/cli - CLI tool untuk scan Laravel routes
│   │   └── src/
│   │       ├── commands/        # CLI command handlers
│   │       ├── generators/      # Core generator classes & layers
│   │       ├── parsers/         # Route parsing logic
│   │       ├── resolvers/       # Semantic resolution untuk types
│   │       └── utils/           # CLI utilities
│   ├── core/             # @routesync/core - HTTP client engine & shared types
│   │   └── src/
│   │       ├── types/           # Core type definitions
│   │       ├── semantic/        # Semantic resolution system
│   │       ├── ir/              # Intermediate Representation builders
│   │       ├── graph/           # Service graph builders
│   │       └── utils/           # Core utilities
│   ├── sdk/              # @routesync/sdk - Developer-facing SDK
│   │   └── src/
│   │       ├── emitter/         # Code emission logic
│   │       └── generator.ts     # Main SDK generator
│   ├── react/            # @routesync/react - React Query hooks
│   │   └── src/
│   │       ├── hooks/           # React hooks untuk data fetching
│   │       └── forms/           # React Hook Form integrations
│   └── vue/              # @routesync/vue - Vue Query composables
│       └── src/
│           ├── composables/     # Vue composables untuk data fetching
│           └── forms/           # VeeValidate integrations
├── tsconfig.json         # Root TypeScript config (strict mode)
├── vitest.config.ts      # Test runner config
├── tsup.config.ts        # Build bundler config
└── turbo.json            # Monorepo pipeline config
```

## Detail Packages

### @routesync/cli
- **Tujuan:** CLI tool untuk scan Laravel/PHP routes dan generate typed SDKs
- **Dependencies:** `@routesync/core`, `commander`, `chalk`, `ora`, `fs-extra`, `php-parser`
- **Binary:** `routesync` command
- **Fungsi utama:**
  - Parse Laravel route files
  - Generate intermediate representation (IR)
  - Emit TypeScript clients, Zod schemas, React/Vue integrations

### @routesync/core  
- **Tujuan:** HTTP client engine dan shared types/utilities
- **Dependencies:** `axios`
- **Fungsi utama:**
  - Core HTTP client functionality
  - Type definitions untuk routing system
  - Semantic resolution kernel
  - Contract IR builders
  - Service graph management

### @routesync/sdk
- **Tujuan:** Developer-facing SDK untuk runtime
- **Dependencies:** `@routesync/core`, `axios`
- **Peer Dependencies:** `zod` (optional)
- **Fungsi utama:**
  - Runtime API client
  - Type-safe HTTP calls
  - Code emission utilities

### @routesync/react
- **Tujuan:** React Query hooks dan form integrations
- **Dependencies:** `@routesync/core`, `@routesync/sdk`
- **Peer Dependencies:** `react`, `@tanstack/react-query`, `react-hook-form` (optional), `@hookform/resolvers` (optional), `zod` (optional)
- **Fungsi utama:**
  - React Query hooks untuk data fetching
  - React Hook Form integrations dengan Zod validation
  - Type-safe form handling

### @routesync/vue
- **Tujuan:** Vue Query composables dan form integrations  
- **Dependencies:** `@routesync/core`, `@routesync/sdk`
- **Peer Dependencies:** `vue`, `@tanstack/vue-query`, `vee-validate` (optional), `@vee-validate/zod` (optional), `zod` (optional)
- **Fungsi utama:**
  - Vue Query composables untuk data fetching
  - VeeValidate integrations dengan Zod validation
  - Type-safe reactive forms

## Dependency Graph Packages

```
@routesync/core (foundational)
    ├── @routesync/sdk (depends on core)
    ├── @routesync/cli (depends on core)  
    ├── @routesync/react (depends on core + sdk)
    └── @routesync/vue (depends on core + sdk)
```

**Build Order:**
1. `@routesync/core` - harus build pertama (foundational)
2. `@routesync/sdk` + `@routesync/cli` - bisa parallel (depend on core)
3. `@routesync/react` + `@routesync/vue` - bisa parallel (depend on core + sdk)

## Build & Perintah

### Development

```bash
# Install dependencies
npm install

# Jalankan dalam watch mode (semua packages)
npm run dev

# Build sekali (semua packages)
npm run build

# Bersihkan folder dist
npm run clean
```

### Testing

```bash
# Jalankan semua tests
npm test

# Jalankan test untuk package spesifik
cd packages/cli && npm test

# Watch mode (butuh flag manual `--watch`)
npm run test:watch
```

### Linting

```bash
# Lint semua packages
npm run lint
```

## Build Output

**Target:** ES2020, ESNext modules (transpiled ke CommonJS + ESM)

**File yang Dihasilkan:**
- `dist/cli.js` - CLI executable (@routesync/cli)
- `dist/core.js` / `dist/core.mjs` - Core engine (@routesync/core)  
- `dist/sdk.js` / `dist/sdk.mjs` - Main SDK export (@routesync/sdk)
- `dist/react.js` / `dist/react.mjs` - React integrations (@routesync/react)
- `dist/vue.js` / `dist/vue.mjs` - Vue integrations (@routesync/vue)
- `dist/*.d.ts` - Type definitions untuk semua packages

**Manajemen Monorepo:**
- Menggunakan Turbo untuk task scheduling
- Setiap package build secara independen tapi share output ke root `dist/`
- Path aliases dikonfigurasi di tsconfig.json (contoh: `@routesync/core`)
- Workspace dependencies otomatis resolve antar packages

## File Konfigurasi Penting

### tsconfig.json
- Strict mode enabled (`"strict": true`)
- Module resolution: Bundler
- Target: ES2020
- Path aliases untuk internal packages

### vitest.config.ts
- Environment: Node
- Global test utilities enabled
- Timeout: 30 detik per test
- Pattern: `**/*.test.ts`, `**/*.integration.test.ts`

### tsup.config.ts
- Menangani building multiple entry points
- Generate both CommonJS dan ESM
- Output TypeScript declarations

## Task Development Umum

| Task | Command | Catatan |
|------|---------|---------|
| Build all | `npm run build` | Buat dist/ di semua packages |
| Watch mode | `npm run dev` | Rebuild saat file berubah |
| Test all | `npm test` | Jalankan via Turbo di semua packages |
| Test satu package | `cd packages/cli && npm test` | Direct Vitest execution |
| Type check | `npx tsc --noEmit` | Cek tipe tanpa emit |
| Clean build | `npm run clean && npm run build` | Full rebuild |

## Catatan Penting

- **TypeScript Strict Mode:** Semua kode harus compile dalam strict mode (tidak boleh `any` implisit)
- **Monorepo:** Perubahan pada shared packages (`core`) mempengaruhi semua dependent packages
- **Build System:** Turbo menjalankan task dalam dependency order; pastikan task tidak gagal
- **Test Environment:** Test berjalan di Node.js environment (tanpa DOM, tanpa browser APIs)
- **Module Exports:** Semua packages mengikuti "exports" map di package.json untuk environment yang berbeda

## Dependencies untuk Task Umum

- **Generating output:** Butuh menjalankan Laravel app + manifest file
- **Type inference:** Bergantung pada akurasi metadata manifest
- **Running CLI:** Binary di `./dist/cli.js` setelah build

## Panduan Khusus RouteSync

### Arsitektur Core
- **Contract IR (Intermediate Representation):** Sistem untuk mengrepresentasikan API contracts
- **Semantic Resolution:** Kernel untuk resolusi semantik dari Laravel routes
- **Emitters:** Layer untuk generate output ke berbagai format (TypeScript, Zod schemas, etc.)

### Generator Pipeline
1. **Parsing:** Parse manifest Laravel dan route definitions
2. **Semantic Resolution:** Resolve types, relationships, dan dependencies
3. **IR Building:** Bangun intermediate representation
4. **Emission:** Generate final output files

### Testing Strategy
- Unit tests untuk individual components
- Integration tests untuk full pipeline
- Property-based testing untuk core algorithms
- Manual testing dengan real Laravel manifests

### Development Workflow
1. Buat/ubah core types di `packages/core`
2. Update generators di `packages/cli`
3. Test dengan script di root directory
4. Verify output dengan real manifest files
5. Run full test suite sebelum commit

## Debugging Tips

- Gunakan `console.log` untuk debug generator output
- Check file `.json` yang digenerate untuk inspect IR
- Test dengan manifest files sederhana dulu
- Gunakan TypeScript compiler untuk validasi type safety
- Monitor build output untuk dependency issues

## Performance Considerations

- Large manifest files bisa lambat di semantic resolution
- Caching digunakan untuk repeated type lookups
- Parallel processing untuk multiple emitters
- Memory management penting untuk large codebases