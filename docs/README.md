# RouteSync Documentation

Complete documentation for RouteSync: a contract compiler that generates type-safe TypeScript SDKs from Laravel routes.

## Quick Navigation

### Getting Started
- **[Quick Start](compiler/QUICK_START.md)** - 5-minute overview of the compiler
- **[Getting Started](getting-started.md)** - Setup and first steps
- **[API Reference](api/)** - Generated SDK API documentation

### Architecture & Design
- **[Compiler Documentation Index](compiler/INDEX.md)** - Complete compiler architecture
- **[Architecture Diagrams](architecture/ARCHITECTURE_DIAGRAMS.md)** - Visual system design
- **[Product Overview](architecture/product.md)** - What RouteSync is and does
- **[Tech Stack](architecture/tech.md)** - Technologies and tools used
- **[Project Structure](architecture/structure.md)** - Codebase organization

### Implementation Guides
- **[Refactoring Documentation](refactoring/)** - Phase 1-6 implementation plan
- **[Generator Implementation](implementation/)** - How to work with generators
- **[Type System](architecture/type-mapping.md)** - SQL → Zod → TypeScript mappings

### Reference
- **[Glossary](compiler/GLOSSARY.md)** - Key terms and definitions
- **[Changelog](../CHANGELOG.md)** - Version history and changes
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

## Documentation Structure

```
docs/
├── README.md                          ← You are here
├── TROUBLESHOOTING.md
├── getting-started.md
├── architecture/
│   ├── ARCHITECTURE_DIAGRAMS.md       Visual reference for compiler pipeline
│   ├── product.md                     What RouteSync is and why
│   ├── tech.md                        Technologies, build system, commands
│   ├── structure.md                   Project organization and folder structure
│   ├── contract_graph_architecture.md Contract compiler concept
│   └── CODEBASE_UNDERSTANDING.md      Deep dive into generator pipeline
├── compiler/
│   ├── INDEX.md                       ← Compiler docs start here
│   ├── QUICK_START.md                 5-minute overview
│   ├── ARCHITECTURE.md
│   ├── PIPELINE.md                    Three-stage compilation
│   ├── IR_SPECIFICATION.md            Intermediate Representation layers
│   ├── SEMANTIC_KERNEL.md             Type resolution logic
│   ├── SEMANTIC_SPECIFICATION.md      Resolution rules and trace evidence
│   ├── GENERATOR_SPECIFICATION.md     13 generator classes
│   ├── IR_NODES.md                    IRNode kinds and specifications
│   ├── CONTRACT_GRAPH.md              Domain modeling with nodes/edges/traits
│   ├── ZOD_AST.md                     Zod schema AST structure
│   ├── RUNTIME_CONTRACT.md            HTTP client and runtime DSL
│   ├── VALIDATION.md                  Type safety and correctness
│   ├── OPTIMIZER.md                   Performance optimizations
│   ├── PLUGIN_API.md                  Plugin architecture and extensibility
│   ├── PASSES.md                      Compiler passes and stages
│   ├── GLOSSARY.md                    Key terms and definitions
│   ├── TYPE_MAPPING.md                SQL type resolution tables
│   ├── SOURCE_MAP.md                  File locations and entry points
│   └── COMPILER_ROADMAP.md            Future phases and enhancements
├── refactoring/
│   ├── INDEX.md                       ← Refactoring guide index
│   ├── PHASE_1_CONSOLIDATED.md        IR Infrastructure (requirements R1-R7)
│   ├── PHASE_2_ZODTIERGENERATOR.md    ZodTierGenerator refactoring
│   ├── PHASE_3_GENERATORS.md          Other generators refactoring
│   ├── PHASE_4_CONSOLIDATION.md       Duplicate elimination
│   ├── PHASE_5_BUGFIXES.md            Known bugs and fixes
│   └── PHASE_6_TESTING.md             Validation and testing plan
├── implementation/
│   ├── GENERATOR_QUICKSTART.md        How to write a new generator
│   ├── TYPE_RESOLUTION.md             Understanding type inference
│   ├── IR_THREADING.md                How to pass IR through pipeline
│   ├── TESTING_GENERATORS.md          Writing tests for generators
│   └── PERFORMANCE_OPTIMIZATION.md    Compiler speed improvements
├── api/
│   ├── README.md                      API reference index
│   ├── SDK.md                         SDK types and functions
│   ├── HOOKS.md                       React hooks API
│   └── TYPES.md                       Generated type reference
└── sessions/
    ├── AUDIT_FINDINGS.md              Architecture audit results
    ├── FINAL_DELIVERABLES_SUMMARY.md  Phase 1-2 deliverables
    └── IMPLEMENTATION_ROADMAP.md      Detailed 6-phase plan
```

---

## Reading Paths by Role

### For Product Managers
1. [Product Overview](architecture/product.md) (5 min)
2. [Compiler Quick Start](compiler/QUICK_START.md) (5 min)
3. [Compiler Roadmap](compiler/COMPILER_ROADMAP.md) (30 min)
4. [Refactoring Index](refactoring/INDEX.md) (10 min)

**Total: 50 minutes**

### For Frontend Developers
1. [Getting Started](getting-started.md) (15 min)
2. [SDK API Reference](api/SDK.md) (20 min)
3. [React Hooks](api/HOOKS.md) (15 min)
4. [Troubleshooting](TROUBLESHOOTING.md) (as needed)

**Total: 50 minutes + reference**

### For Backend Engineers (Laravel)
1. [Product Overview](architecture/product.md) (5 min)
2. [Compiler Quick Start](compiler/QUICK_START.md) (5 min)
3. [Getting Started](getting-started.md) (15 min)
4. [Architecture Diagrams](architecture/ARCHITECTURE_DIAGRAMS.md) (10 min)

**Total: 35 minutes**

### For Compiler/Generator Developers
1. [Compiler Quick Start](compiler/QUICK_START.md) (5 min)
2. [Compiler Architecture Index](compiler/INDEX.md) (10 min)
3. [IR Specification](compiler/IR_SPECIFICATION.md) (20 min)
4. [Semantic Kernel](compiler/SEMANTIC_KERNEL.md) (30 min)
5. [Generator Specification](compiler/GENERATOR_SPECIFICATION.md) (45 min)
6. [Implementation Guide](implementation/GENERATOR_QUICKSTART.md) (30 min)

**Total: 140 minutes**

### For Architects/Tech Leads
1. [Architecture Diagrams](architecture/ARCHITECTURE_DIAGRAMS.md) (15 min)
2. [Compiler Architecture](compiler/ARCHITECTURE.md) (20 min)
3. [Contract Graph Architecture](architecture/contract_graph_architecture.md) (15 min)
4. [Refactoring Overview](refactoring/INDEX.md) (20 min)
5. [Compiler Roadmap](compiler/COMPILER_ROADMAP.md) (30 min)

**Total: 100 minutes**

### For Optimization/Performance Engineers
1. [Compiler Quick Start](compiler/QUICK_START.md) (5 min)
2. [Compiler Pipeline](compiler/PIPELINE.md) (10 min)
3. [Passes](compiler/PASSES.md) (15 min)
4. [Optimizer](compiler/OPTIMIZER.md) (20 min)
5. [Compiler Roadmap → Phase 3](compiler/COMPILER_ROADMAP.md) (20 min)

**Total: 70 minutes**

---

## Key Concepts

### Contract Compiler
RouteSync is **not** a code generator. It's a **contract compiler** that:
1. Extracts contract information from Laravel (routes, types, validations)
2. Resolves semantic meaning (what is each type, really?)
3. Generates type-safe, validated code that enforces the contract

Similar to: TypeScript (for JavaScript), Protocol Buffers (for RPC), OpenAPI (for REST).

### Three Compilation Stages
```
Laravel App
    ↓
annotate (optional) — add #[Response(Model::class)] attributes
    ↓
scan — extract routes, resolve types, generate manifest.json
    ↓
generate — consume manifest, emit TypeScript code
    ↓
React/Vue Frontend (with types, validation, hooks)
```

### Intermediate Representation (IR)
The compiler resolves all type decisions during `scan`, storing them in `routesync.manifest.json`. All generators **read** this IR rather than re-deriving, ensuring consistency.

Three IR layers:
- **Raw**: PHP code strings with hints
- **Parsed AST**: Expression tree (property access, method calls, etc.)
- **Semantic**: Fully resolved types (model, resource, primitive, collection, etc.)

---

## Current Status

### Phase 1 ✅ COMPLETE (July 2026)
- Identified 7 major architectural issues
- Created comprehensive audit documentation
- Designed refactoring roadmap (6 phases, 50-70 days)
- Implemented Phase 1 requirements (R1-R7)

### Phase 2-6 (Planned)
- IR consolidation and shared infrastructure
- ZodTierGenerator split (1890 lines → 6 focused modules)
- Unification of duplicate logic (ACTION_MAP, resource resolution, type inference)
- Comprehensive testing and optimization

---

## Common Tasks

### I want to understand how RouteSync works
→ Read: [Compiler Quick Start](compiler/QUICK_START.md) → [Getting Started](getting-started.md)

### I found a bug in type resolution
→ Read: [Semantic Specification](compiler/SEMANTIC_SPECIFICATION.md) + [Type Mapping](compiler/TYPE_MAPPING.md)

### I want to add a new generator
→ Read: [Generator Quickstart](implementation/GENERATOR_QUICKSTART.md) → [Plugin API](compiler/PLUGIN_API.md)

### I want to optimize compilation speed
→ Read: [Optimizer](compiler/OPTIMIZER.md) → [Performance Optimization](implementation/PERFORMANCE_OPTIMIZATION.md)

### I'm working on the refactoring
→ Read: [Refactoring Index](refactoring/INDEX.md) + corresponding phase document

### I want to generate frontend code
→ Read: [Getting Started](getting-started.md) → [SDK API Reference](api/SDK.md)

### I want to understand the architecture
→ Read: [Architecture Diagrams](architecture/ARCHITECTURE_DIAGRAMS.md) → [Compiler Architecture](compiler/ARCHITECTURE.md)

---

## Document Status & Maintenance

| Document | Last Updated | Status | Audience |
|----------|--------------|--------|----------|
| compiler/INDEX.md | July 25, 2026 | ✅ Current | Engineers |
| compiler/QUICK_START.md | July 25, 2026 | ✅ Current | Everyone |
| architecture/*.md | July 25, 2026 | ✅ Current | Everyone |
| refactoring/*.md | July 25, 2026 | ✅ Current | Developers |
| sessions/*.md | July 25, 2026 | 📚 Archive | Reference |
| API docs | Varies | 🔄 Generated | Developers |

---

## Contributing to Documentation

1. **Make code changes** in `packages/cli/src/` or elsewhere
2. **Update corresponding docs** in `docs/`
3. **Update version/date** in document headers
4. **Link from INDEX** if adding new documents
5. **Run build** to verify changes don't break anything

Key principle: **Documentation is code. It must stay in sync.**

---

## Quick Reference

### Package Topology
- `@routesync/cli` → Compiler (scan, generate commands)
- `@routesync/core` → Shared IR types + SemanticKernelV2
- `@routesync/sdk` → Runtime DSL (defineApi, endpoint, resource)
- `@routesync/react` → React Query integration
- `@routesync/vue` → Vue Query integration

### Entry Points
- CLI: `packages/cli/src/index.ts`
- Compiler: `packages/cli/src/commands/scan.ts` + `generate.ts`
- Semantic Resolution: `packages/core/src/semantic/SemanticKernelV2.ts`
- Generators: `packages/cli/src/generators/`

### Key Files
- IR Spec: `packages/core/src/types/semantic.ts`
- Manifest: `packages/core/src/types/route.ts`
- Main Resolver: `packages/core/src/semantic/SemanticKernelV2.ts`
- Main Generator (1890 lines): `packages/cli/src/generators/ZodTierGenerator.ts`

---

## Getting Help

- **📖 Documentation**: Start with [Compiler Quick Start](compiler/QUICK_START.md)
- **🐛 Found a bug?**: Check [Troubleshooting](TROUBLESHOOTING.md)
- **❓ Questions?**: Check [Glossary](compiler/GLOSSARY.md)
- **🔧 How do I...?**: Use the "Reading Paths by Role" section above

---.kiro/steering

**Last Updated:** July 25, 2026  
**Compiler Version:** IR v2  
**Documentation Version:** 2.0
