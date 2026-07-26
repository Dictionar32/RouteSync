# RouteSync Compiler Documentation Index

**Last Updated:** July 25, 2026  
**Compiler Version:** IR v2  
**Status:** Reference Documentation

This folder contains architectural and specification documentation for RouteSync's compiler pipeline. All documents are sourced from `/compiler` folder analysis and active codebase.

## Quick Navigation

### For Quick Understanding (Start Here)
- **[QUICK_START.md](QUICK_START.md)** - 5-minute overview of compiler stages
- **[PIPELINE.md](PIPELINE.md)** - Three-stage compilation architecture
- **[IR_SPECIFICATION.md](IR_SPECIFICATION.md)** - Intermediate Representation layers

### Core Architecture
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Package topology and compilation flow
- **[SEMANTIC_KERNEL.md](SEMANTIC_KERNEL.md)** - Type resolution and semantic analysis
- **[CONTRACT_GRAPH.md](CONTRACT_GRAPH.md)** - Contract graph structure (nodes, edges, traits)
- **[GENERATOR_SPECIFICATION.md](GENERATOR_SPECIFICATION.md)** - 13 generator classes overview

### IR & Data Structures
- **[IR_NODES.md](IR_NODES.md)** - IRNode kinds: Operation, Aggregate, Trait, Workflow, Event, Schema
- **[IR_LAYERS.md](IR_LAYERS.md)** - Three IR layers: Raw → Parsed AST → Semantic
- **[ZOD_AST.md](ZOD_AST.md)** - Zod schema AST (fourth independent IR)

### Advanced Topics
- **[PASSES.md](PASSES.md)** - Compiler passes and pipeline stages
- **[SEMANTIC_SPECIFICATION.md](SEMANTIC_SPECIFICATION.md)** - Resolution rules and trace evidence
- **[VALIDATION.md](VALIDATION.md)** - Type safety and correctness checks
- **[RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md)** - HTTP client and runtime DSL

### Optimization & Future
- **[OPTIMIZER.md](OPTIMIZER.md)** - Code generation optimizations
- **[PLUGIN_API.md](PLUGIN_API.md)** - Plugin architecture for extensibility
- **[COMPILER_ROADMAP.md](COMPILER_ROADMAP.md)** - Future phases and enhancement plans

### Reference
- **[GLOSSARY.md](GLOSSARY.md)** - Key terms and definitions
- **[TYPE_MAPPING.md](TYPE_MAPPING.md)** - SQL type → Zod → TypeScript type mappings
- **[SOURCE_MAP.md](SOURCE_MAP.md)** - File locations and entry points

---

## Document Matrix

| Document | Purpose | Audience | Read Time |
|----------|---------|----------|-----------|
| QUICK_START | Overview | Everyone | 5 min |
| PIPELINE | Compilation flow | Engineers | 10 min |
| IR_SPECIFICATION | Data structure spec | Compiler devs | 20 min |
| ARCHITECTURE | System design | Architects | 20 min |
| SEMANTIC_KERNEL | Resolution logic | Backend devs | 30 min |
| CONTRACT_GRAPH | Domain modeling | Domain experts | 30 min |
| GENERATOR_SPECIFICATION | Code generation | Generator devs | 45 min |
| PASSES | Pipeline stages | Compiler devs | 15 min |
| SEMANTIC_SPECIFICATION | Resolution rules | Backend devs | 45 min |
| RUNTIME_CONTRACT | Runtime behavior | Frontend devs | 20 min |
| VALIDATION | Type checking | QA | 15 min |
| OPTIMIZER | Performance | Backend devs | 20 min |
| PLUGIN_API | Extension points | Framework devs | 25 min |
| COMPILER_ROADMAP | Future work | Product team | 30 min |

---

## Source Files (From /compiler Folder)

### Core Specifications
- `Nodes.md` → [IR_NODES.md](IR_NODES.md)
- `CompilerArchitecture.md` → [ARCHITECTURE.md](ARCHITECTURE.md)
- `IntermediateRepresentation.md` → [IR_LAYERS.md](IR_LAYERS.md)
- `CompilerPipeline.md` → [PIPELINE.md](PIPELINE.md)
- `Passes.md` → [PASSES.md](PASSES.md)

### Semantic & Resolution
- `SemanticSpecification.md` → [SEMANTIC_SPECIFICATION.md](SEMANTIC_SPECIFICATION.md)
- `SemanticKernelV2` knowledge → [SEMANTIC_KERNEL.md](SEMANTIC_KERNEL.md)
- `ContractGraph.md` → [CONTRACT_GRAPH.md](CONTRACT_GRAPH.md)
- `Edges.md` → [CONTRACT_GRAPH.md](CONTRACT_GRAPH.md) (Edges section)

### Generation & Output
- `GeneratorSpecification.md` → [GENERATOR_SPECIFICATION.md](GENERATOR_SPECIFICATION.md)
- `ZodToTSEmitIR.ts` knowledge → [ZOD_AST.md](ZOD_AST.md)

### Runtime & Contracts
- `RuntimeContract.md` → [RUNTIME_CONTRACT.md](RUNTIME_CONTRACT.md)
- `Validation.md` → [VALIDATION.md](VALIDATION.md)

### Advanced Topics
- `Optimizer.md` → [OPTIMIZER.md](OPTIMIZER.md)
- `PluginAPI.md` → [PLUGIN_API.md](PLUGIN_API.md)
- `CompilerRoadmap.md` → [COMPILER_ROADMAP.md](COMPILER_ROADMAP.md)

### Vision & Strategy
- `CompilerVision2030.md` → Archived (future planning)
- `Constitution.md` → Archived (philosophical foundations)
- `ZeroBoilerplate.md` → [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md)

---

## Reading Paths

### Path 1: I Want to Understand How Code Generation Works
1. QUICK_START (5 min)
2. PIPELINE (10 min)
3. ARCHITECTURE → Section 1-2 (10 min)
4. GENERATOR_SPECIFICATION (45 min)
5. RUNTIME_CONTRACT (20 min)

**Total: 90 minutes**

### Path 2: I Need to Fix a Bug in Type Resolution
1. QUICK_START (5 min)
2. IR_LAYERS (20 min)
3. SEMANTIC_KERNEL (30 min)
4. SEMANTIC_SPECIFICATION (45 min)
5. TYPE_MAPPING (10 min)

**Total: 110 minutes**

### Path 3: I'm Adding a New Generator
1. QUICK_START (5 min)
2. ARCHITECTURE (20 min)
3. GENERATOR_SPECIFICATION (45 min)
4. IR_SPECIFICATION (20 min)
5. PLUGIN_API (25 min)

**Total: 115 minutes**

### Path 4: I'm Optimizing Compilation Performance
1. PIPELINE (10 min)
2. PASSES (15 min)
3. OPTIMIZER (20 min)
4. COMPILER_ROADMAP (30 min)

**Total: 75 minutes**

### Path 5: I'm Working on the Refactoring (Phase 1-6)
1. QUICK_START (5 min)
2. ARCHITECTURE (20 min)
3. IR_SPECIFICATION (20 min)
4. GENERATOR_SPECIFICATION (45 min)
5. SEMANTIC_KERNEL (30 min)
6. See: `/docs/refactoring/` for implementation guides

**Total: 120 minutes**

---

## Key Concepts to Know

### Compilation Pipeline
RouteSync compiles in three stages:
1. **Annotate** (optional): Add PHP attributes to source code
2. **Scan**: Extract routes/models from Laravel app, resolve types, produce IR (manifest.json)
3. **Generate**: Consume IR, emit TypeScript code files

### Intermediate Representation
Three layers of increasing semantic richness:
1. **Raw Layer**: Extracted PHP code strings with hints
2. **Parsed AST**: Expression tree (property access, method calls, literals, etc.)
3. **Semantic Layer**: Fully resolved types (model, resource, primitive, collection, etc.)

### Semantic Resolution
Two independent kernels:
- **SemanticKernelV2**: Used by `scan` (production path)
- **SemanticResolutionKernel**: Used by `audit`/`explain` (introspection path)

Both implement ~40 resolution rules for Eloquent models, accessors, casts, resources, etc.

### Code Generation
13 independent generator classes:
- **ZodTierGenerator** (1890 lines): Largest, generates 6 output files
- **HookGenerator, SDKGenerator, TypeGenerator**: Main generators
- **10 others**: ConstantsGenerator, ModelGenerator, etc.

### Contract Graph
Domain modeling structure representing:
- **Nodes**: Operation (route), Aggregate (entity boundary), Trait (capability), Workflow, Event, Schema
- **Edges**: Relationships and dependencies
- Used for complex scenarios (polymorphic relations, conditional validation, event subscribers)

---

## Important Architectural Decisions

### 1. Reflection Over Parsing
Extraction uses **PHP runtime reflection** against a booted Laravel app, not static PHP parsing. This ensures exact route resolution, middleware detection, and schema accuracy.

### 2. Three Semantic Kernels Are Debt
Two independent semantic resolution implementations exist (`SemanticKernelV2` + `SemanticResolutionKernel`). This was historical but should be unified for maintainability.

### 3. IR Not Fully Utilized
The `normalizeManifest()` IR is computed but not passed to all generators. Each generator re-derives semantic decisions, risking silent divergence.

### 4. Dead Code: CompilerBackendGenerator
`packages/sdk/src/generator.ts` + `ZodToTSEmitIR.ts` form a complete, unused code generation backend. Current generation path (`@routesync/cli` generators) supersedes it.

### 5. Manifest Duality
The manifest isn't a pure IR — it's partially-resolved JSON with multiple serialization formats (`routesync.manifest.json` vs `routesync.graph.json` with elaborated fields).

---

## Future Phases

See [COMPILER_ROADMAP.md](COMPILER_ROADMAP.md) for:
- **Phase 1-2**: IR consolidation and generator refactoring
- **Phase 3**: Incremental compilation with stableHash caching
- **Phase 4**: Plugin system for custom generators
- **Phase 5**: Performance optimization and batch compilation

---

## Getting Help

**I don't understand X concept:**
→ Look in [GLOSSARY.md](GLOSSARY.md), then read the referenced document

**I found a bug in type resolution:**
→ Read [SEMANTIC_SPECIFICATION.md](SEMANTIC_SPECIFICATION.md) for rules, check [TYPE_MAPPING.md](TYPE_MAPPING.md)

**I want to add a new generator:**
→ Read [GENERATOR_SPECIFICATION.md](GENERATOR_SPECIFICATION.md) + [PLUGIN_API.md](PLUGIN_API.md)

**I need to optimize compilation:**
→ Read [OPTIMIZER.md](OPTIMIZER.md) + [COMPILER_ROADMAP.md](COMPILER_ROADMAP.md)

**Performance is slow:**
→ Check [PASSES.md](PASSES.md) pipeline stages, profile against [OPTIMIZER.md](OPTIMIZER.md) recommendations

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | July 2026 | Consolidated compiler docs, added index, structured for maintainability |
| 1.0 | Earlier | Original inline documentation in `/compiler` folder |

---

## Contributing

When updating compiler architecture:
1. Update the source file in `/compiler`
2. Mirror changes in corresponding `/docs/compiler/*.md`
3. Update this INDEX.md if adding/removing documents
4. Run `npm run build` to verify TypeScript still compiles
5. Add test coverage for new resolution rules

---

**Last Review:** July 25, 2026  
**Maintainer:** RouteSync Architecture Team
