# Scanner-Compiler-Writers Architecture Refactoring

## 📋 Overview

This specification defines the refactoring of RouteSync's architecture from a monolithic parser-generator model into a clean **three-layer pipeline**:

```
Scanner (Extract Facts) → Compiler (Analyze) → Writers (Generate)
```

## 📚 Documentation Structure

### 1. **SUMMARY.md** - Start Here! ⭐
High-level overview for stakeholders and team leads.
- The problem we're solving
- 3-layer architecture overview
- Key benefits
- Implementation roadmap
- Success criteria

**Read this first** for understanding the "why" and "what".

### 2. **design.md** - Complete Technical Design
Comprehensive technical specification.
- Executive summary with problem statement
- Complete system architecture
- Detailed component design
- Data flow walkthrough
- Artifact types specification
- Pass architecture details
- Writer interface and contracts
- Integration points with existing code
- Backward compatibility strategy
- Performance considerations
- Implementation timeline
- Success metrics

**Read this** for implementation planning and technical depth.

### 3. **ARCHITECTURE_REFERENCE.md** - Technical Reference
Detailed reference guide and diagrams.
- System context diagram (full)
- Component ownership matrix
- Data structure hierarchy with examples
- Pass execution strategy and dependency graphs
- Writer registration mechanism
- Type safety validation layers
- Performance optimization points
- Error handling strategy
- Monitoring and observability
- Extension points for customization
- Testing strategy
- Deployment and rollout plan

**Read this** when implementing or extending the system.

### 4. **.config.kiro** - Specification Metadata
Kiro workflow configuration for this spec.
- Spec ID for tracking
- Workflow type: design-first
- Spec type: feature

---

## 🎯 Key Design Points

### Three Layers

| Layer | Purpose | Input | Output | Example |
|-------|---------|-------|--------|---------|
| **Scanner** | Extract facts | routes/api.php | RawManifest | Parse route definitions |
| **Compiler** | Analyze semantically | RawManifest | ArtifactRegistry | Infer response types |
| **Writers** | Generate output | ArtifactRegistry | Code files | Generate TypeScript |

### Single Source of Truth

**ArtifactRegistry** stores all analysis results:
- ResponseArtifact - response type analysis
- ValidationArtifact - form validation rules
- ResourceArtifact - resource class metadata
- ModelArtifact - database schema
- RouteArtifact - complete route definitions

No duplication between parser, compiler, and writers.

### Key Benefits

1. **Separation of Concerns** - Each layer has one responsibility
2. **Single Source of Truth** - All data in ArtifactRegistry
3. **Testability** - Components independently testable
4. **Extensibility** - Add writers without parser changes
5. **Type Safety** - All artifacts strongly typed
6. **Performance** - Parallel passes, smart caching

---

## 📊 Artifact Family

```typescript
// Analysis results from compiler passes

ResponseArtifact
├─ transport: 'resource' | 'model' | 'json' | 'primitive' | 'binary'
├─ body: ResponseBody (resource, model, object, or primitive)
├─ confidence: ConfidenceScore (with reasoning)
└─ span: FileSpan (source location)

ValidationArtifact
├─ rules: Record<string, string[]> (Zod rules)
└─ messages: Record<string, string> (custom messages)

ResourceArtifact
├─ name: string
├─ model: string | undefined
├─ properties: PropertyDescriptor[]
└─ conditionalAttributes: ConditionalAttribute[]

ModelArtifact
├─ name: string
├─ table: string
├─ attributes: ModelAttribute[]
└─ relationships: RelationshipDescriptor[]

RouteArtifact
├─ method: string
├─ path: string
├─ controller: string
├─ action: string
├─ responseRef: string (reference to ResponseArtifact)
├─ validationRef: string (reference to ValidationArtifact)
└─ middleware: string[]
```

---

## 🔄 Data Flow

```
1. SCANNER PHASE
   Laravel Code
      ↓
   [LaravelRouteScanner]
   [ControllerMethodScanner]
   [ResourceScanner]
   [FormRequestScanner]
   [ModelScanner]
      ↓
   RawManifest (deterministic JSON)

2. COMPILER PHASE
   RawManifest
      ↓
   [ResponseAnalysisPass] → ResponseArtifact[]
   [ResourceAnalysisPass] → ResourceArtifact[]
   [ValidationAnalysisPass] → ValidationArtifact[]
   [ModelAnalysisPass] → ModelArtifact[]
   [RouteAnalysisPass] → RouteArtifact[]
   [ArtifactIntegrationPass] → Validation
      ↓
   ArtifactRegistry (single source of truth)

3. WRITER PHASE
   ArtifactRegistry
      ↓
   [ManifestWriter] → routesync.manifest.json
   [TypeScriptWriter] → types.ts, api.ts, hooks.ts
   [SDKWriter] → client.ts
   [OpenAPIWriter] → openapi.json
      ↓
   Output Files
```

---

## 🏗️ Implementation Phases

### Phase 1: Infrastructure (Week 1-2)
- Create artifact types
- Implement ArtifactRegistry
- Update PassManager

### Phase 2: Scanner (Week 3-4)
- Extract Scanner interface
- Refactor LaravelRouteParser → LaravelRouteScanner
- Create RawManifest format

### Phase 3: Compiler (Week 5-6)
- Implement 5+ analysis passes
- Create artifact types
- Add pass orchestration

### Phase 4: Writers (Week 7-8)
- Create Writer interface
- Implement core writers
- Add extensibility

### Phase 5: Integration (Week 9-10)
- Update CLI
- Performance optimization
- Documentation & release

---

## ✅ Success Metrics

- ✅ LaravelRouteParser reduced from 2000 → 300 lines
- ✅ Each pass < 250 lines
- ✅ 95%+ test coverage
- ✅ Single source of truth validated
- ✅ Zero breaking CLI changes
- ✅ 10% faster generation
- ✅ 20% memory reduction

---

## 🔗 Related Specifications

- **Compiler Architecture** - Existing compiler infrastructure we reuse
- **Pass System** - PassManager and pass orchestration
- **Artifact Pattern** - TypedArtifact base class and registry
- **Type System** - Semantic type inference system

---

## 👥 Stakeholders

| Role | Interest | Reference |
|------|----------|-----------|
| **Core Team** | Architecture clarity | design.md, ARCHITECTURE_REFERENCE.md |
| **Backend Devs** | Writer extensibility | ARCHITECTURE_REFERENCE.md - Extension Points |
| **Frontend Devs** | API contracts | SUMMARY.md - Key Benefits |
| **DevOps/Infra** | Performance & caching | ARCHITECTURE_REFERENCE.md - Performance |
| **QA/Testing** | Test strategy | ARCHITECTURE_REFERENCE.md - Testing |

---

## 🚀 Quick Navigation

**I want to understand...**

| What I Want | Read This | Time |
|-------------|-----------|------|
| Why we need this | SUMMARY.md | 5 min |
| How it works (full) | design.md | 20 min |
| Technical details | ARCHITECTURE_REFERENCE.md | 15 min |
| Implementation plan | design.md → Phase section | 10 min |
| How to extend | ARCHITECTURE_REFERENCE.md → Extension Points | 10 min |
| Error handling | ARCHITECTURE_REFERENCE.md → Error Handling | 5 min |
| Testing approach | ARCHITECTURE_REFERENCE.md → Testing | 5 min |

---

## 📝 Design Principles

1. **Separation of Concerns** - Each layer does one thing
2. **Single Source of Truth** - One artifact registry
3. **Type Safety** - All artifacts strongly typed
4. **Extensibility** - Easy to add new writers
5. **Testability** - Components independently testable
6. **Performance** - Caching, parallelism, incremental
7. **Backward Compatibility** - No CLI breaking changes

---

## 🎓 Learning Path

**For New Team Members:**
1. Start with SUMMARY.md (5 min)
2. Review the architecture diagrams in ARCHITECTURE_REFERENCE.md (5 min)
3. Read the three-layer explanation in design.md (10 min)
4. Study component ownership matrix (5 min)
5. Review one example pass implementation (10 min)

**For Implementation:**
1. Review complete design.md (20 min)
2. Study ARCHITECTURE_REFERENCE.md for component details (15 min)
3. Reference artifact types definition (10 min)
4. Follow implementation phases and checklists (ongoing)

---

## 📞 Questions & Support

For questions about:
- **Architecture** - See design.md, ARCHITECTURE_REFERENCE.md
- **Implementation** - See implementation timeline in design.md
- **Extension** - See Extension Points in ARCHITECTURE_REFERENCE.md
- **Migration** - See Backward Compatibility in design.md
- **Performance** - See Performance section in ARCHITECTURE_REFERENCE.md

---

## 📄 Document Versions

| Document | Version | Status | Last Updated |
|----------|---------|--------|--------------|
| design.md | 1.0 | Complete | 2024-01 |
| SUMMARY.md | 1.0 | Complete | 2024-01 |
| ARCHITECTURE_REFERENCE.md | 1.0 | Complete | 2024-01 |

---

## 🎯 Next Steps

1. **Review** - Team reviews design documents
2. **Feedback** - Collect feedback and questions
3. **Refinement** - Adjust design based on feedback
4. **Spike** - Build minimal prototype
5. **Implementation** - Full implementation following phases
6. **Testing** - Comprehensive testing suite
7. **Deployment** - Phased rollout with monitoring

---

**Status:** 🟢 Design Complete  
**Phase:** 📋 Review & Feedback  
**Owner:** RouteSync Core Team  
**Last Updated:** January 2024

---

**Start with SUMMARY.md →**
