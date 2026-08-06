# Evidence-Based Architecture Analysis

## Filosofi

**Sebelum mengusulkan desain atau menulis implementasi, lakukan reverse engineering terhadap codebase.**

Arsitektur yang baik dibangun berdasarkan **pemahaman mendalam** terhadap sistem yang ada, bukan asumsi atau pola umum.

---

## Aturan Wajib

### 1. ❌ Jangan Mengasumsikan Berdasarkan Nama

**SALAH:**
```typescript
// Melihat file bernama "CompilerBridge.ts"
// Asumsi: "Ini pasti bridge pattern antara compiler dan generator"
```

**BENAR:**
```typescript
// 1. Baca implementasi CompilerBridge
// 2. Identifikasi:
//    - Input parameters (apa yang diterima?)
//    - Output values (apa yang dihasilkan?)
//    - Dependencies (apa yang digunakan?)
//    - Side effects (apa yang diubah?)
// 3. Trace data flow:
//    - Dari mana data masuk?
//    - Kemana data keluar?
//    - Transformasi apa yang terjadi?
```

---

### 2. 🔍 Bangun Data Flow dari Evidence

**Pipeline Construction:**
```
Producer → [Transformation 1] → [Transformation 2] → Consumer
```

**Untuk setiap komponen, dokumentasikan:**


#### A. Entry Point
- **Di mana komponen ini dipanggil?**
- **Siapa yang memiliki lifecycle-nya?**
- **Kapan instance dibuat/destroyed?**

**Template:**
```markdown
Entry Point: [File:Line]
Called by: [Component/Function]
Lifecycle: [Created at X, Destroyed at Y]
Ownership: [Who controls this instance]
```

#### B. Data Input
- **Parameter types (actual, not assumed)**
- **Source of data (traced ke origin)**
- **Validation/transformation applied**

**Template:**
```markdown
Input:
  - param1: Type (from SourceClass.method)
  - param2: Type (from Artifact.field)
  
Validation: [None | Runtime check | Type guard]
Pre-conditions: [What must be true before call]
```

#### C. Data Output
- **Return type (actual, not declared)**
- **Side effects (mutations, I/O, global state)**
- **Error conditions**

**Template:**
```markdown
Output:
  - Returns: Type (passed to ConsumerClass.method)
  - Side effects:
    * Mutates: [Object/State]
    * I/O: [File/Network operations]
    * Events: [Emitted events]
    
Error paths:
  - throws ErrorType when [condition]
  - returns undefined when [condition]
```


#### D. Dependencies
- **Direct imports (what's actually used)**
- **Dependency injection (what's passed in)**
- **Implicit dependencies (global state, singletons)**

**Template:**
```markdown
Dependencies:
  Direct imports:
    - import A from './A' → uses A.method1, A.method2
    - import B from './B' → uses B.factory only
    
  Injected:
    - constructor(registry: TypeRegistry) → used for type lookup
    
  Implicit:
    - Reads process.env.NODE_ENV
    - Accesses global CompilerContext
```

#### E. Responsibility
- **Primary purpose (berdasarkan implementation)**
- **Secondary responsibilities (jika ada)**
- **What it does NOT do (penting!)**

**Template:**
```markdown
Primary: Transforms SemanticType to TSTypeNode
Secondary: Tracks imports for generated types
Does NOT:
  - Emit code (delegated to Emitter)
  - Validate semantic types (assumes valid input)
  - Handle circular references (caller's responsibility)
```

---

### 3. 📊 Kategorikan Temuan dengan Jelas

**Gunakan label eksplisit:**


#### ✅ FAKTA (Supported by Implementation)

**Kriteria:** Ada bukti kode yang jelas

**Example:**
```markdown
✅ FAKTA: TypeScriptGenerator.semanticTypeToTSType() returns TSTypeNode
Evidence: Line 150-250, return type explicitly TSTypeNode, 
          all branches return TSTypeNode subtypes

✅ FAKTA: ImportCollector uses Map<string, Set<string>> for storage
Evidence: Line 25, private imports: Map<string, Set<string>>
```

#### 🔍 INFERENSI (Logical Conclusion)

**Kriteria:** Tidak eksplisit, tapi logis dari bukti yang ada

**Example:**
```markdown
🔍 INFERENSI: TypeScriptGenerator should be called before Emitter
Reasoning: 
  - Generator produces TSFile (Evidence: line 300)
  - Emitter accepts TSFile as input (Evidence: Emitter.ts line 50)
  - Therefore: Generator → Emitter dependency
  
⚠️  NOT VERIFIED: Belum cek apakah ada path yang skip Generator
```

#### ❓ HIPOTESIS (Unproven, Needs Investigation)

**Kriteria:** Dugaan yang masih perlu dibuktikan

**Example:**
```markdown
❓ HIPOTESIS: PassManager may execute passes in parallel
Basis: PassManager has dependency graph (line 100)
Needs verification:
  - [ ] Check if PassManager uses Promise.all()
  - [ ] Analyze execution logs for timing
  - [ ] Look for mutex/locking mechanisms
```


---

### 4. 🚨 Identifikasi Ketidakcocokan (Mismatch)

**Cari inkonsistensi antara:**
- Implementation vs Documentation
- Design intent vs Actual behavior
- Type declarations vs Runtime behavior
- Test expectations vs Production usage

**Template:**
```markdown
🚨 MISMATCH FOUND:

Location: CompilerBridge.ts line 120
Issue: Documentation says "returns TypeScript code"
Reality: Actually returns GeneratedTypeScriptArtifact object

Impact: High
Affected: CLI expects string, gets artifact
Fix needed: Update CLI or bridge contract
```

---

### 5. ⏸️ Jangan Menulis Kode Sebelum Flow Lengkap

**Checklist sebelum implementasi:**

```markdown
Pre-Implementation Checklist:
- [ ] Entry points identified
- [ ] All producers traced
- [ ] All consumers traced
- [ ] Data transformations mapped
- [ ] Dependencies documented
- [ ] Error paths understood
- [ ] Side effects catalogued
- [ ] Test coverage analyzed
- [ ] Performance characteristics known
- [ ] Concurrency model understood
```

**Jika belum semua ✅, STOP dan lakukan investigasi lebih lanjut.**


---

### 6. 📢 Nyatakan Information Gaps dengan Jelas

**Jangan fill gaps dengan asumsi!**

**Template:**
```markdown
❌ BAD:
"PassManager probably executes passes sequentially based on 
 dependency order, so we should implement..."

✅ GOOD:
"🔍 INFORMATION GAP: PassManager execution model unknown

Files to analyze:
  - [ ] PassManager.ts (execution logic)
  - [ ] PassGraph.ts (dependency resolution)
  - [ ] PassManager.test.ts (behavior expectations)
  
Questions to answer:
  1. Sequential or parallel execution?
  2. How are dependencies resolved?
  3. What happens on pass failure?
  4. Is there retry logic?
  
BLOCKER: Cannot design integration until execution model understood.
Will analyze these files next."
```

---

### 7. 💥 Document Architecture Change Impact

**Sebelum propose perubahan, analyze impact:**

**Template:**
```markdown
Proposed Change: Move type resolution from Generator to separate Pass

Impact Analysis:

1. Producers (Upstream):
   - ManifestLoader: No change (still produces manifest)
   - SemanticAnalyzer: ✅ New consumer of this pass
   
2. Consumers (Downstream):
   - Generator: ⚠️  Breaking change (loses type resolution)
   - Emitter: No change (still consumes Generator output)
   
3. Dependencies:
   - TypeRegistry: ✅ Shared dependency (no change)
   - EloquentSchema: ⚠️  Moved from Generator to new Pass
   
4. Pipeline:
   - Before: Manifest → Generator → Emitter
   - After: Manifest → TypeResolver → Generator → Emitter
   - ⚠️  Performance: +1 pass, but parallelizable
   
5. Tests:
   - Generator tests: ⚠️  Need update (mock type input)
   - Integration tests: ⚠️  New pass needs test suite
   
6. Migration:
   - Step 1: Create new pass (non-breaking)
   - Step 2: Dual-run both approaches
   - Step 3: Remove old logic from Generator
   - Estimated effort: 3 days
```


---

### 8. 🔗 Traceability: Evidence → Recommendation

**Setiap rekomendasi HARUS traceable ke bukti.**

**Example:**

```markdown
Recommendation: Generator should not handle import collection

Evidence chain:
1. Generator.ts line 150-200 handles imports (FACT)
2. ImportCollector is separate class (FACT: ImportCollector.ts)
3. Single Responsibility Principle violated (INFERENCE)
4. Import logic duplicated in 3 places (FACT: grep results)
5. Tests show Generator+ImportCollector always used together (FACT: tests)

Conclusion: Extract import handling to dedicated component

Supporting files:
  - Generator.ts (current implementation)
  - ImportCollector.ts (existing abstraction)
  - Generator.test.ts line 120-150 (coupling evidence)
  - TypeScriptGeneratorPass.ts line 80 (usage pattern)
```

---

### 9. ⚡ Speed vs Evidence Trade-off

**PRIORITAS: Evidence-based analysis > Implementation speed**

❌ **ANTI-PATTERN:**
```markdown
"Let's quickly implement this based on common pattern X,
 we can refactor later if needed"
```

✅ **CORRECT APPROACH:**
```markdown
"Before implementing, I need to understand:
 1. How existing system works (2 hours analysis)
 2. Where this fits in pipeline (1 hour tracing)
 3. Impact on consumers (1 hour analysis)
 
Total: 4 hours analysis before 2 hours implementation.
Result: Correct implementation first time, zero refactor."
```

**ROI Justification:**
- 4 hours analysis + 2 hours implementation = 6 hours total
- vs Quick implementation 1 hour + 10 hours debugging + 5 hours refactor = 16 hours total
- **Savings: 10 hours (62% faster overall)**


---

### 10. 🎯 Evidence Collection Workflow

**Step-by-step process:**

#### Phase 1: Initial Discovery (Quick Scan)
```markdown
1. List all relevant files (5 min)
2. Read main entry points (15 min)
3. Identify key interfaces/types (10 min)
4. Map high-level data flow (10 min)

Output: Architecture overview diagram
Time: ~40 minutes
```

#### Phase 2: Deep Analysis (Detailed Investigation)
```markdown
For each component:
1. Read complete implementation (20-30 min per file)
2. Document inputs/outputs (10 min)
3. Trace dependencies (15 min)
4. Identify side effects (10 min)
5. Catalog error paths (10 min)
6. Review tests for behavior (15 min)

Output: Component analysis document
Time: ~1-2 hours per major component
```

#### Phase 3: Integration Analysis (Cross-cutting)
```markdown
1. Map complete data flow end-to-end (30 min)
2. Identify integration points (20 min)
3. Document communication patterns (20 min)
4. Find potential race conditions (20 min)
5. Analyze performance characteristics (20 min)

Output: System integration diagram
Time: ~2 hours
```

#### Phase 4: Validation (Verify Understanding)
```markdown
1. Write hypotheses about system behavior
2. Design experiments to test hypotheses
3. Run experiments (trace calls, add logging)
4. Document findings (update with evidence)

Output: Validated architecture model
Time: ~1-2 hours
```


---

## Practical Examples from RouteSync

### Example 1: TypeScriptGenerator Analysis

**Initial Question:** "How does TypeScriptGenerator work?"

**❌ BAD Approach:**
```
"It's a generator, so probably uses visitor pattern to 
 traverse AST and emit code. Let me implement similar pattern..."
```

**✅ GOOD Approach:**

```markdown
## Evidence Collection

### Entry Point Analysis
✅ FACT: Called from TypeScriptGeneratorPass.run()
  Location: TypeScriptGeneratorPass.ts line 120
  Signature: generator.generate(graph: ContractGraph): TSFile

### Input Analysis  
✅ FACT: Receives ContractGraph, not individual types
  Evidence: Method signature line 50
  Source: ContractGraph built by ContractGraphBuilder

### Output Analysis
✅ FACT: Returns TSFile, not string
  Evidence: Return type line 50, implementation line 300
  Consumer: TSFormatter expects TSFile input

### Transformation Analysis
✅ FACT: Converts SemanticType → TSTypeNode via semanticTypeToTSType()
  Evidence: Lines 150-250
  Handles 9 type variants (exhaustive switch)

### Dependency Analysis
✅ FACT: Uses ImportCollector for tracking imports
  Evidence: Line 30 constructor injection
  Evidence: Line 180 this.importCollector.addNamedImport()

🔍 INFERENCE: Generator doesn't emit code, only builds AST
  Reasoning: Returns TSFile (tree structure), no string generation
  Consumer: Emitter does the actual code generation

❓ HIPOTESIS: Generator might cache type conversions
  Basis: Expensive operation, likely repeated
  Needs verification: Check for Map/WeakMap in implementation
```


### Example 2: PassManager Integration Investigation

**Question:** "How should I integrate new pass into PassManager?"

**Evidence-Based Investigation:**

```markdown
## Phase 1: Understand PassManager Contract

### File: PassManager.ts

✅ FACT: PassManager.registerPass(pass: CompilerPass)
  Evidence: Line 45
  Accepts any CompilerPass implementation

✅ FACT: Pass execution via run() method
  Evidence: Line 100-150
  Signature: pass.run(inputs: CompilerArtifact[]): CompilerArtifact[]

✅ FACT: Dependency resolution via PassDescriptor
  Evidence: Line 60-80
  Uses consumes/produces for graph building

### File: CompilerPass.ts (Interface)

✅ FACT: Required methods
  - getDescriptor(): PassDescriptor
  - run(inputs): outputs
  Evidence: Interface definition lines 10-30

🔍 INFORMATION GAP: Execution order determination
Files needed:
  - [ ] PassGraph.ts (dependency resolution)
  - [ ] PassManager.test.ts (execution behavior)

## Phase 2: Analyze Existing Pass

### File: TypeScriptGeneratorPass.ts (Working Example)

✅ FACT: Pass declares dependencies via descriptor
  Evidence: Line 40-60
  consumes: ['SemanticTypes']
  produces: ['GeneratedTypeScript']

✅ FACT: Run method receives typed tuple
  Evidence: Line 90
  Signature: run(inputs: [SemanticTypesArtifact])

✅ FACT: Validation happens at start of run()
  Evidence: Line 95-100
  Checks artifact type before processing

🔍 INFERENCE: PassManager handles type validation
  Reasoning: Pass assumes valid input type
  Needs verification: Check PassManager for validation logic

## Phase 3: Integration Requirements

Based on evidence, new pass must:
1. Implement CompilerPass interface (REQUIRED)
2. Declare consumes/produces in descriptor (REQUIRED)
3. Validate input artifacts (RECOMMENDED)
4. Return correct artifact types (REQUIRED)
5. Handle errors gracefully (RECOMMENDED)

🔗 Supporting evidence:
  - CompilerPass.ts interface
  - TypeScriptGeneratorPass.ts implementation
  - PassManager.ts registration logic
```


---

## Tools & Techniques

### 1. Code Tracing Commands

```bash
# Find all callers of a function
grep -r "functionName" packages/ --include="*.ts"

# Find all implementations of interface
grep -r "implements InterfaceName" packages/ --include="*.ts"

# Find all usages of a type
grep -r ": TypeName" packages/ --include="*.ts"

# Trace data flow
grep -r "variableName" packages/ --include="*.ts" | grep -E "(=|:)"
```

### 2. AST Analysis (for complex flows)

```typescript
// Use TypeScript Compiler API to trace types
import ts from 'typescript'

function traceTypeFlow(fileName: string, symbolName: string) {
  const program = ts.createProgram([fileName], {})
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(fileName)
  
  // Find symbol and trace its usage
  // (detailed implementation)
}
```

### 3. Dynamic Tracing (runtime analysis)

```typescript
// Add temporary logging to trace execution
function analyzeFlow() {
  console.log('[TRACE] Entry:', JSON.stringify(input))
  const result = processData(input)
  console.log('[TRACE] Exit:', JSON.stringify(result))
  return result
}
```

### 4. Test Analysis (behavior verification)

```bash
# Run tests with detailed output
npm test -- --verbose

# Check test coverage
npm run test:coverage

# Analyze test patterns
grep -r "expect(" packages/**/*.test.ts | wc -l
```


---

## Documentation Template

**Use this template for all architecture analysis:**

```markdown
# [Component Name] Analysis

## Overview
Brief description of what this component does (1-2 sentences)

## Entry Points
- Primary: [File:Line] called by [Caller]
- Secondary: [File:Line] called by [Caller]

## Data Flow

### Input
| Parameter | Type | Source | Validation |
|-----------|------|--------|------------|
| param1 | Type1 | ComponentA.method | Runtime check |
| param2 | Type2 | Artifact.field | Type guard |

### Output
| Return | Type | Consumer | Notes |
|--------|------|----------|-------|
| result | Type3 | ComponentB.method | May be null |

### Side Effects
- Mutates: [Object/State]
- I/O: [Operations]
- Events: [Emitted events]

## Dependencies

### Direct
```typescript
import A from './A'  // Uses: A.method1, A.method2
import B from './B'  // Uses: B.factory
```

### Injected
```typescript
constructor(
  registry: TypeRegistry,  // Used for: type lookups
  config: Config          // Used for: feature flags
)
```

### Implicit
- Reads: process.env.NODE_ENV
- Accesses: global.compilerContext

## Transformations
1. Input → [Transformation A] → Intermediate
2. Intermediate → [Transformation B] → Output

## Error Handling
- Throws: ErrorType when [condition]
- Returns: undefined when [condition]
- Logs: warning when [condition]

## Test Coverage
- Unit tests: [File] (X tests)
- Integration tests: [File] (Y tests)
- Coverage: Z%

## Evidence Classification

### ✅ Facts
1. [Fact statement] (Evidence: [File:Line])
2. [Fact statement] (Evidence: [Test result])

### 🔍 Inferences
1. [Inference] (Reasoning: [Logic], Supporting: [Facts])

### ❓ Hypotheses
1. [Hypothesis] (Needs: [Files to check])

## 🚨 Mismatches Found
None / [List mismatches]

## 🔗 Integration Points
- Upstream: [Producer components]
- Downstream: [Consumer components]
- Sibling: [Parallel components]

## 📊 Performance Characteristics
- Time complexity: O(?)
- Space complexity: O(?)
- Measured: [Benchmark results]

## 🎯 Recommendations
[Only if analysis is complete]

Each recommendation must reference evidence above.
```


---

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: "Similar Name = Similar Function"

```markdown
BAD: "CompilerBridge must be Bridge Pattern because of its name"

GOOD: Read CompilerBridge implementation first:
  - What does it actually bridge?
  - Does it match GoF Bridge Pattern characteristics?
  - Evidence: [Implementation details]
```

### ❌ Anti-Pattern 2: "Standard Pattern Must Apply"

```markdown
BAD: "This looks like MVC, so there must be a clear separation 
      between Model/View/Controller"

GOOD: Map actual responsibilities:
  - What handles data? (Evidence: [Files])
  - What handles presentation? (Evidence: [Files])
  - What handles coordination? (Evidence: [Files])
  - Conclusion: [Actual pattern with evidence]
```

### ❌ Anti-Pattern 3: "Documentation is Correct"

```markdown
BAD: "Documentation says it returns string, so implementation 
      must return string"

GOOD: Check actual implementation:
  - Return type: GeneratedTypeScriptArtifact (Evidence: Line X)
  - Documentation: Says returns string
  - 🚨 MISMATCH: Update documentation or fix implementation
```

### ❌ Anti-Pattern 4: "Tests Prove Behavior"

```markdown
BAD: "Tests pass, so implementation is correct"

GOOD: Tests prove narrow behavior:
  - Tests cover: [Specific scenarios]
  - Tests do NOT cover: [Edge cases, integration, performance]
  - Need additional validation: [List gaps]
```


### ❌ Anti-Pattern 5: "Skip Analysis, Refactor Later"

```markdown
BAD: "Let's implement quickly now, we can refactor if needed"

GOOD: Analyze first, implement once:
  Analysis time: 4 hours
  Implementation time: 2 hours
  Total: 6 hours
  
  vs
  
  Quick implementation: 1 hour
  Debug issues: 5 hours
  Refactor: 4 hours
  Re-test: 3 hours
  Total: 13 hours
  
  Evidence-based approach saves 7 hours (54%)
```

---

## Success Metrics

### Analysis Quality Indicators

✅ **Good Analysis:**
- Every statement has evidence reference
- Clear distinction between fact/inference/hypothesis
- All data flows traced end-to-end
- Integration points documented
- Mismatches identified and reported
- Information gaps explicitly stated

❌ **Poor Analysis:**
- Assumptions without evidence
- Vague statements ("probably", "might", "should")
- Missing data flow connections
- Undocumented integration points
- Silent about mismatches
- Gaps filled with guesses

### Time Investment Guidelines

| Component Size | Analysis Time | Implementation Time | Ratio |
|----------------|---------------|---------------------|-------|
| Small (< 200 LOC) | 1 hour | 0.5 hour | 2:1 |
| Medium (200-500 LOC) | 2 hours | 1 hour | 2:1 |
| Large (500-1000 LOC) | 4 hours | 2 hours | 2:1 |
| Extra Large (1000+ LOC) | 8 hours | 4 hours | 2:1 |

**Rule of thumb:** Analysis should take ~2x implementation time


---

## Review Checklist

Before proposing any design or writing implementation, verify:

### Pre-Design Checklist
- [ ] All relevant files identified and read
- [ ] Entry points documented with evidence
- [ ] Data flow mapped end-to-end
- [ ] All producers identified
- [ ] All consumers identified
- [ ] Dependencies documented
- [ ] Side effects catalogued
- [ ] Error paths understood
- [ ] Test coverage analyzed
- [ ] Performance characteristics known
- [ ] Integration points mapped
- [ ] Mismatches identified and reported
- [ ] Information gaps explicitly stated

### Pre-Implementation Checklist
- [ ] All items from Pre-Design ✅
- [ ] Design reviewed against evidence
- [ ] Impact analysis completed
- [ ] Migration path defined (if breaking)
- [ ] Test strategy defined
- [ ] Rollback plan exists
- [ ] Performance targets set
- [ ] Success metrics defined

### Post-Implementation Review
- [ ] Implementation matches analysis predictions
- [ ] All evidence-based assumptions validated
- [ ] New mismatches documented
- [ ] Documentation updated with actual behavior
- [ ] Architecture diagram updated
- [ ] Lessons learned captured

---

## Application to RouteSync

**Current Status (Phase 3 Day 7):**

✅ **Well-Analyzed Components:**
- TypeScriptGenerator (148 tests, full flow documented)
- ImportCollector (23 tests, behavior verified)
- TypeScriptGeneratorPass (35 tests, integration validated)

⏳ **Needs Analysis (Day 7 Tasks):**
- PassManager execution model
- CLI integration flow
- CompilerBridge actual behavior
- End-to-end pipeline orchestration

**Next Steps:**
1. Evidence-based analysis of PassManager (2-3 hours)
2. CLI integration flow mapping (2 hours)
3. End-to-end data flow verification (1-2 hours)
4. Only then: Implementation (2 hours)

**Expected Result:**
- Correct integration first time
- Zero refactoring needed
- All tests pass
- Documentation accurate

---

## Summary

**Core Principle:**
> Understanding through evidence > Speed of implementation

**Process:**
1. Collect evidence from code
2. Build data flow model
3. Identify gaps and mismatches
4. Document with clear classifications
5. Design based on evidence
6. Implement with confidence

**Result:**
- Fewer bugs
- Better architecture
- Faster overall delivery
- Maintainable codebase

---

*This steering file applies to ALL RouteSync development, especially when working with compiler infrastructure.*

**Last Updated:** 2026-08-05
**Status:** Active - Apply to all architectural decisions

---

## Data Ownership & Lifecycle Analysis

**Untuk setiap struktur data penting, jawab 10 pertanyaan fundamental:**

### The 10 Critical Questions

#### 1. Siapa yang memiliki (owner) data ini?
**Owner = komponen yang mengontrol lifecycle data**

Template:
```markdown
Owner: [ComponentName]
Evidence: [File:Line where data is created/managed]
Lifetime: [From X to Y]
Cleanup: [How/when is data freed]
```

#### 2. Siapa yang boleh membuatnya?
**Creator = komponen dengan authority untuk instantiate**

Template:
```markdown
Creators (authorized):
  - [Component1]: via [method/factory] (Evidence: [File:Line])
  - [Component2]: via [method/factory] (Evidence: [File:Line])

Not Allowed:
  - [Component3]: violates [principle/constraint]
```

#### 3. Siapa yang boleh mengubahnya?
**Mutators = komponen dengan write access**

Template:
```markdown
Mutators:
  - [Component1]: can modify [fields] (Evidence: [File:Line])
  - [Component2]: can modify [fields] (Evidence: [File:Line])

Immutable after: [Stage/Event]
Rationale: [Why mutation restricted]
```


#### 4. Siapa yang hanya boleh membaca?
**Readers = komponen with read-only access**

Template:
```markdown
Read-Only Consumers:
  - [Component1]: reads [fields] for [purpose] (Evidence: [File:Line])
  - [Component2]: reads [fields] for [purpose] (Evidence: [File:Line])

Enforcement: [Type system | Runtime validation | Convention]
```

#### 5. Pada tahap pipeline mana data ini masih valid?
**Validity scope = pipeline stages where data is meaningful**

Template:
```markdown
Valid stages:
  ✅ [Stage1]: Data is current/accurate
  ✅ [Stage2]: Data is current/accurate
  ❌ [Stage3]: Data may be stale (replaced by [NewData])
  
Invalidation triggers:
  - [Event/Condition] → data becomes stale
  - [Event/Condition] → data must be refreshed
```

#### 6. Pada tahap mana data ini dianggap final?
**Finalization point = when data becomes immutable/canonical**

Template:
```markdown
Becomes final at: [Stage/Event]
Evidence: [File:Line where frozen/sealed]

Before finalization:
  - State: [Mutable/Building/Partial]
  - Can be changed by: [Components]

After finalization:
  - State: [Immutable/Frozen/Sealed]
  - Changes: Not allowed / Create new instance
```


#### 7. Apakah data ini mutable atau immutable?
**Mutability analysis**

Template:
```markdown
Mutability: [Fully Immutable | Partially Mutable | Fully Mutable]

Implementation:
  - readonly properties: [Yes/No] (Evidence: [File:Line])
  - Object.freeze(): [Yes/No] (Evidence: [File:Line])
  - Deep immutability: [Yes/No] (Evidence: [Test results])

Mutation points (if mutable):
  - [Field]: mutable during [Stage] by [Component]
  - [Field]: mutable during [Stage] by [Component]

Immutability guarantees:
  - Structural sharing: [Yes/No]
  - Copy-on-write: [Yes/No]
  - Persistent data structures: [Yes/No]
```

#### 8. Apakah data ini merupakan source of truth atau hasil turunan?
**Data lineage = primary vs derived**

Template:
```markdown
Classification: [Source of Truth | Derived Data | Cache]

If Source of Truth:
  - Primary for: [Domain/Concept]
  - Authoritative representation of: [What]
  - Derived data that depends on this:
    * [DerivedData1] (via [Transformation])
    * [DerivedData2] (via [Transformation])

If Derived:
  - Source: [SourceData] (Evidence: [File:Line])
  - Transformation: [How computed]
  - Synchronization: [When updated]
  - Can be recomputed: [Yes/No]
  - Cache strategy: [None | LRU | TTL]
```


#### 9. Apakah data ini boleh dikonsumsi lintas layer?
**Layer boundary analysis**

Template:
```markdown
Layer restrictions: [Allowed | Prohibited | Conditional]

If Allowed:
  - Available to layers: [Layer1, Layer2]
  - Access mechanism: [Direct import | Service | Registry]
  - Visibility: [Public API | Internal]

If Prohibited:
  - Restricted to layer: [LayerName]
  - Rationale: [Encapsulation | Coupling | Performance]
  - Alternative: Use [PublicInterface] instead

If Conditional:
  - Allowed when: [Condition]
  - Via adapter: [AdapterName]
  - With transformation: [TransformationLogic]

Evidence:
  - Package exports: [File:Line]
  - Access modifiers: [public/private/protected]
  - Actual usage: [grep results]
```

#### 10. Jika data dihapus, komponen apa saja yang akan rusak?
**Dependency impact analysis**

Template:
```markdown
Direct dependencies (will break immediately):
  - [Component1]: uses [field/method] (Evidence: [File:Line])
  - [Component2]: uses [field/method] (Evidence: [File:Line])

Indirect dependencies (will break transitively):
  - [Component3]: via [Component1]
  - [Component4]: via [Component2]

Alternative approaches if removed:
  1. [Alternative1]: Use [replacement] instead
  2. [Alternative2]: Refactor to [new approach]

Migration complexity: [Low | Medium | High]
Estimated effort: [X hours/days]
Risk level: [Low | Medium | High]
```


---

## Complete Analysis Template

**For every important data structure, fill this template:**

```markdown
# [DataStructureName] Ownership & Lifecycle Analysis

## 1. Ownership
Owner: [ComponentName]
Evidence: [File:Line]
Lifetime: From [creation point] to [destruction point]
Cleanup: [Automatic/Manual] via [mechanism]

## 2. Creators (Who can create)
Authorized:
  - [Component1]: via [factory/constructor] (Evidence: [File:Line])
  - [Component2]: via [factory/constructor] (Evidence: [File:Line])

Prohibited:
  - [Component3]: Reason: [Why not allowed]

## 3. Mutators (Who can modify)
Write access:
  - [Component1]: fields [x, y] (Evidence: [File:Line])
  - [Component2]: fields [z] (Evidence: [File:Line])

Immutable after: [Stage/Event]
Enforcement: [readonly | Object.freeze | Convention]

## 4. Readers (Who can only read)
Read-only consumers:
  - [Component1]: reads [fields] for [purpose]
  - [Component2]: reads [fields] for [purpose]

## 5. Validity Scope
Valid in stages:
  ✅ [Stage1]: Current and accurate
  ✅ [Stage2]: Current and accurate  
  ❌ [Stage3]: Stale, replaced by [NewData]

Invalidation: [Triggers that make data invalid]

## 6. Finalization Point
Becomes final at: [Stage/Event]
Before: [Mutable/Partial state]
After: [Immutable/Complete state]
Evidence: [File:Line where frozen]

## 7. Mutability
Type: [Fully Immutable | Partially Mutable | Fully Mutable]
Implementation:
  - readonly: [Yes/No]
  - Object.freeze: [Yes/No]
  - Deep immutability: [Yes/No]

## 8. Data Lineage
Classification: [Source of Truth | Derived | Cache]
Source: [If derived, from what]
Transformation: [How computed]
Dependencies: [What depends on this]

## 9. Layer Access
Restrictions: [Allowed | Prohibited | Conditional]
Available to: [Layers that can access]
Mechanism: [How accessed]
Evidence: [Package exports, actual usage]

## 10. Deletion Impact
Direct breakage:
  - [Component1]: uses [what] (Evidence: [File:Line])
  - [Component2]: uses [what] (Evidence: [File:Line])

Indirect breakage:
  - [Component3]: via [intermediate]

Alternatives: [What to use instead]
Migration effort: [Low/Medium/High]
Risk: [Low/Medium/High]

---

## Summary
- Ownership: Clear | Unclear | Shared
- Lifecycle: Well-defined | Needs clarification
- Mutability: Appropriate | Needs review
- Access control: Enforced | Needs enforcement
- Documentation: Complete | Needs update
```


---

## RouteSync Data Structure Analysis Examples

### Example 1: TSFile (Target AST)

```markdown
# TSFile Ownership & Lifecycle Analysis

## 1. Ownership
Owner: TypeScriptGenerator
Evidence: TypeScriptGenerator.ts line 300 (returns TSFile)
Lifetime: From generation to emission completion
Cleanup: Automatic (garbage collected after emit)

## 2. Creators
Authorized:
  - TypeScriptGenerator: via generate() method (Line 50)
  - TSFile.create(): factory method (Target AST nodes)

Prohibited:
  - Direct consumers (must use Generator)

## 3. Mutators
Write access: NONE (Immutable after creation)
  - TSFile is frozen via Object.freeze() (Evidence: TSFile.ts line 80)

## 4. Readers
Read-only consumers:
  - TypeScriptFormatter: reads for optimization (Line 45)
  - TypeScriptEmitter: reads for code generation (Line 120)
  - Visitors: traverse tree structure

## 5. Validity Scope
Valid in stages:
  ✅ Generation: Being constructed
  ✅ Formatting: Can be optimized/transformed
  ✅ Emission: Final form for code gen
  ❌ After emission: No longer needed

## 6. Finalization Point
Becomes final at: TypeScriptGenerator.generate() return
Before: Builder pattern constructs tree
After: Fully frozen, immutable tree
Evidence: TSFile.ts line 80 (Object.freeze)

## 7. Mutability
Type: Fully Immutable
Implementation:
  - readonly: Yes (all properties)
  - Object.freeze: Yes (line 80)
  - Deep immutability: Yes (all child nodes frozen)

## 8. Data Lineage
Classification: Derived Data
Source: ContractGraph (from IR)
Transformation: semanticTypeToTSType() conversion
Dependencies:
  - TypeScriptFormatter (optimizes this)
  - TypeScriptEmitter (generates code from this)

## 9. Layer Access
Restrictions: Allowed (Public API)
Available to: Formatter, Emitter, Pipeline
Mechanism: Direct import from @core/compiler/target
Evidence: Exported in target/index.ts

## 10. Deletion Impact
Direct breakage:
  - TypeScriptFormatter.format(): expects TSFile input
  - TypeScriptEmitter.emit(): expects TSFile input

Indirect breakage:
  - All code generation pipeline

Alternatives: None (this IS the target representation)
Migration effort: N/A (cannot remove)
Risk: Critical (core data structure)

## Summary
- Ownership: ✅ Clear (Generator owns)
- Lifecycle: ✅ Well-defined (Gen → Format → Emit)
- Mutability: ✅ Fully immutable
- Access control: ✅ Type system enforced
- Documentation: ✅ Complete
```


### Example 2: GeneratedTypeScriptArtifact (Compiler Artifact)

```markdown
# GeneratedTypeScriptArtifact Ownership & Lifecycle Analysis

## 1. Ownership
Owner: TypeScriptGeneratorPass
Evidence: TypeScriptGeneratorPass.ts line 120 (creates and returns artifact)
Lifetime: From pass execution to pipeline completion
Cleanup: Managed by PassManager (artifact registry cleanup)

## 2. Creators
Authorized:
  - TypeScriptGeneratorPass.run(): Primary creator (Line 120)
  - Test factories: For testing only (test files)

Prohibited:
  - Manual construction by consumers
  - Direct instantiation outside pass system

## 3. Mutators
Write access: NONE (Immutable after creation)
  - All properties readonly (Evidence: GeneratedTypeScriptArtifact.ts line 10-30)
  - Created once, never modified

## 4. Readers
Read-only consumers:
  - PassManager: Tracks artifacts in registry
  - Next passes: May consume this artifact
  - CLI: Extracts code for file writing
  - Tests: Validate artifact contents

## 5. Validity Scope
Valid in stages:
  ✅ Pass execution: Being created
  ✅ Pipeline: Available to subsequent passes
  ✅ CLI output: Used for code generation
  ❌ After file write: No longer needed

Invalidation: After files written to disk

## 6. Finalization Point
Becomes final at: Pass.run() return
Before: Pass is building internal state
After: Artifact frozen and complete
Evidence: Returned as output artifact (line 140)

## 7. Mutability
Type: Fully Immutable
Implementation:
  - readonly: Yes (all properties readonly)
  - Object.freeze: Not explicit, but convention
  - Deep immutability: Yes (nested GeneratedImport[] readonly)

## 8. Data Lineage
Classification: Derived Data
Source: SemanticTypesArtifact (input to pass)
Transformation: TypeScriptGenerator.generate() conversion
Dependencies:
  - CLI: Reads .code property for file writing
  - Downstream passes: May read metadata

## 9. Layer Access
Restrictions: Allowed (Public artifact)
Available to: All compiler passes, CLI, tests
Mechanism: Artifact registry (PassManager)
Evidence: Exported from artifacts/index.ts

## 10. Deletion Impact
Direct breakage:
  - CLI: Expects this artifact for code output
  - PassManager: Artifact registry would need update
  - Tests: All integration tests would break

Indirect breakage:
  - File generation pipeline
  - End-to-end code generation flow

Alternatives: Create different artifact type
Migration effort: High (change pass interface)
Risk: High (breaks CLI integration)

## Summary
- Ownership: ✅ Clear (Pass owns)
- Lifecycle: ✅ Well-defined (Pass → Pipeline → CLI)
- Mutability: ✅ Immutable by design
- Access control: ✅ Registry enforced
- Documentation: ✅ Complete
```


### Example 3: SemanticType (Type System)

```markdown
# SemanticType Ownership & Lifecycle Analysis

## 1. Ownership
Owner: Type system (no single owner - shared representation)
Evidence: SemanticType.ts defines union type (line 1-50)
Lifetime: From parsing to final code emission
Cleanup: Garbage collected when no longer referenced

## 2. Creators
Authorized:
  - Type parsers: Create from Laravel definitions
  - Type builders: Factory methods (createPrimitiveType, etc.)
  - SemanticAnalyzer: Infer types from metadata

Prohibited:
  - Direct object literals (use factory methods)

## 3. Mutators
Write access: NONE (Immutable by design)
  - Created with final state
  - No mutation methods exist
  - Transformations create new instances

## 4. Readers
Read-only consumers:
  - TypeScriptGenerator: Converts to TSTypeNode
  - Validation passes: Check type correctness
  - Optimization passes: Analyze type relationships
  - Debug tools: Display type information

## 5. Validity Scope
Valid in stages:
  ✅ Parsing: Types extracted from source
  ✅ Semantic analysis: Types resolved and validated
  ✅ Generation: Types converted to target language
  ✅ Optimization: Types analyzed for improvements
  ❌ After emission: No longer needed (replaced by generated code)

## 6. Finalization Point
Becomes final at: Type resolution completion
Before: Partial types, unresolved references
After: Fully resolved, complete type information
Evidence: After semantic resolution pass

## 7. Mutability
Type: Fully Immutable
Implementation:
  - readonly: Yes (discriminated union with readonly fields)
  - Object.freeze: Not explicit (structural typing)
  - Deep immutability: Yes (nested types also readonly)

Transformation pattern:
```typescript
// ❌ No mutation
type.name = 'newName'  // Compile error

// ✅ Create new type
const newType = { ...type, name: 'newName' }
```

## 8. Data Lineage
Classification: Source of Truth
Primary for: Type information in compiler
Authoritative representation of: All type concepts
Derived data that depends on this:
  - TSTypeNode: Target language representation
  - ValidationSchema: Runtime validation rules
  - TypeMetadata: Documentation and tooling

## 9. Layer Access
Restrictions: Allowed (Core type system)
Available to: All compiler layers
Mechanism: Direct import from @core/compiler/types
Evidence: Used across all packages

Cross-layer usage:
  - Parser layer: Creates SemanticType
  - Analysis layer: Transforms SemanticType
  - Generation layer: Consumes SemanticType
  - Validation: Type checking with SemanticType

## 10. Deletion Impact
Direct breakage: EVERYTHING
  - TypeScriptGenerator: Core input type
  - All type analysis passes
  - Validation system
  - Documentation generation

Indirect breakage:
  - Entire compiler pipeline
  - All code generation
  - Type safety guarantees

Alternatives: None (this IS the type system)
Migration effort: N/A (cannot remove)
Risk: Critical (foundational data structure)

## Summary
- Ownership: ✅ Shared (type system primitive)
- Lifecycle: ✅ Well-defined (parse → emit)
- Mutability: ✅ Fully immutable
- Access control: ✅ Type system enforced
- Documentation: ✅ Complete with type guards
```


### Example 4: ContractIR (Intermediate Representation)

```markdown
# ContractIR Ownership & Lifecycle Analysis

## 1. Ownership
Owner: ContractIRBuilder
Evidence: Builds and returns ContractIR (ContractIRBuilder.ts)
Lifetime: From IR building to generation completion
Cleanup: Garbage collected after generation

## 2. Creators
Authorized:
  - ContractIRBuilder: Primary builder (build() method)
  - Test factories: For testing scenarios

Prohibited:
  - Direct construction (complex invariants)
  - Partial IR (must be complete)

## 3. Mutators
Write access: Builder only (during construction)
  - ContractIRBuilder: Mutable during build phase
  - After build(): Immutable

Immutable after: build() returns
Enforcement: Convention + readonly types

## 4. Readers
Read-only consumers:
  - TypeScriptGenerator: Primary consumer
  - Validation passes: Verify IR correctness
  - Optimization passes: Transform IR
  - Debug tools: Visualize IR structure

## 5. Validity Scope
Valid in stages:
  ✅ IR Building: Being constructed
  ✅ IR Validation: Checking correctness
  ✅ Code Generation: Converting to target
  ❌ After generation: Superseded by target AST

Invalidation: After TypeScriptGenerator produces TSFile

## 6. Finalization Point
Becomes final at: ContractIRBuilder.build() return
Before: Builder accumulates data
After: Complete, validated IR
Evidence: Returned from build() method

## 7. Mutability
Type: Builder Mutable → Final Immutable
Implementation:
  - During build: Mutable accumulation
  - After build: Frozen structure
  - readonly properties on result

Builder pattern:
```typescript
const builder = new ContractIRBuilder()
builder.addContract(...)  // Mutable
builder.addType(...)      // Mutable
const ir = builder.build() // Immutable result
```

## 8. Data Lineage
Classification: Intermediate Representation
Source: Manifest + Semantic analysis
Transformation: Semantic → IR → Target
Dependencies:
  - TypeScriptGenerator: Converts IR → TSFile
  - Validation: Checks IR structure
  - Optimization: Improves IR

Position in flow:
```
Manifest → Semantic → [ContractIR] → Target AST → Code
```

## 9. Layer Access
Restrictions: Conditional (IR layer only)
Available to: Generation layer, optimization
Prohibited: Direct CLI access (use via generator)

Rationale: IR is implementation detail, not public API

Access mechanism:
  - Generator receives IR
  - Optimization passes transform IR
  - CLI never sees IR directly

## 10. Deletion Impact
Direct breakage:
  - TypeScriptGenerator.generate(): Expects ContractIR input
  - IR validation passes
  - Optimization passes

Indirect breakage:
  - Code generation pipeline
  - Type conversion flow

Alternatives: 
  1. Direct Semantic → Target (skip IR)
     Risk: Loss of optimization opportunities
  2. Different IR format
     Effort: High (redesign generation)

Migration effort: High (core data flow)
Risk: High (central to architecture)

## Summary
- Ownership: ✅ Clear (Builder owns)
- Lifecycle: ✅ Well-defined (Build → Generate)
- Mutability: ✅ Builder mutable, result immutable
- Access control: ✅ Layer boundaries enforced
- Documentation: ⚠️  Needs more detail on structure
```


### Example 5: CompilationState (Pass System)

```markdown
# CompilationState Ownership & Lifecycle Analysis

## 1. Ownership
Owner: PassManager
Evidence: PassManager creates and manages state (PassManager.ts line 80)
Lifetime: Duration of compilation pipeline
Cleanup: After all passes complete

## 2. Creators
Authorized:
  - PassManager: Creates initial state
  - PassManager.execute(): Manages lifecycle

Prohibited:
  - Individual passes (receive state, don't create)
  - External consumers

## 3. Mutators
Write access: Passes (controlled mutation)
  - Passes add artifacts to registry
  - Passes update context
  - PassManager orchestrates changes

Mutation protocol:
```typescript
// ✅ Allowed: Add artifacts
state.artifacts.set(key, artifact)

// ✅ Allowed: Update context
state.context.update(...)

// ❌ Prohibited: Replace state object
state = newState  // Compile error (const)
```

## 4. Readers
Read-only consumers:
  - Passes: Read artifacts from previous passes
  - PassManager: Monitor state for diagnostics
  - Debug tools: Inspect compilation progress

## 5. Validity Scope
Valid in stages:
  ✅ Pipeline execution: Active state
  ✅ Pass execution: Current pass context
  ❌ After pipeline: Stale (results extracted)

Validity period: Single compilation run

## 6. Finalization Point
Becomes final at: Pipeline completion
Before: Passes actively mutating
After: Final artifact set available
Evidence: PassManager.execute() completion

## 7. Mutability
Type: Controlled Mutable (Artifact accumulation)
Implementation:
  - State object: Immutable reference (const)
  - Artifact registry: Mutable collection (Map)
  - Individual artifacts: Immutable values

Pattern:
```typescript
// State itself: immutable reference
const state = new CompilationState()

// Registry: mutable collection
state.artifacts.set(key, value)  // ✅ Allowed

// Artifacts: immutable values
const artifact = state.artifacts.get(key)
artifact.field = x  // ❌ Compile error (readonly)
```

## 8. Data Lineage
Classification: Transient State
Source: Created fresh for each compilation
Transformation: Accumulates artifacts as passes execute
Dependencies:
  - All pass outputs stored here
  - PassManager reads for next pass input

Lifecycle:
```
Create → Pass1 adds artifacts → Pass2 reads/adds → ... → Extract results → Discard
```

## 9. Layer Access
Restrictions: Pass system only
Available to: PassManager, CompilerPass implementations
Prohibited: CLI direct access, external consumers

Rationale: Implementation detail of pass system

Access pattern:
  - PassManager creates
  - Passes receive via run(state)
  - Results extracted by PassManager
  - CLI receives final artifacts, not state

## 10. Deletion Impact
Direct breakage:
  - PassManager.execute(): Core orchestration
  - All CompilerPass.run() methods expect state
  - Artifact communication between passes

Indirect breakage:
  - Entire pass pipeline
  - Compilation orchestration
  - Incremental compilation

Alternatives:
  1. Direct pass-to-pass communication
     Risk: Tight coupling, hard to test
  2. Event bus
     Risk: Loss of type safety, debugging harder

Migration effort: Critical (redesign pass system)
Risk: Critical (core architecture)

## Summary
- Ownership: ✅ Clear (PassManager owns)
- Lifecycle: ✅ Well-defined (per-compilation)
- Mutability: ✅ Controlled (artifact accumulation)
- Access control: ✅ Pass system boundary
- Documentation: ✅ Complete with usage patterns
```


---

## Quick Reference: Data Structure Categories

### Category 1: Immutable Value Objects
**Examples:** TSFile, TSTypeNode, SemanticType

**Characteristics:**
- Created once, never modified
- Safe to share across threads/contexts
- Can be cached indefinitely
- Transformation creates new instance

**Ownership pattern:**
```typescript
Owner: Creator (returns immutable value)
Mutators: None
Lifecycle: Until no references remain
```

### Category 2: Builder Pattern Objects
**Examples:** ContractIRBuilder, some artifact builders

**Characteristics:**
- Mutable during construction
- Immutable after build()
- Complex invariants enforced
- Validates on finalization

**Ownership pattern:**
```typescript
Owner: Builder instance
Mutators: Builder only (during construction)
Lifecycle: Build → Freeze → Return immutable
```

### Category 3: Transient State Objects
**Examples:** CompilationState, execution context

**Characteristics:**
- Short-lived (single operation)
- Accumulates data during processing
- Discarded after use
- Not persisted

**Ownership pattern:**
```typescript
Owner: Orchestrator (e.g., PassManager)
Mutators: Controlled (passes add artifacts)
Lifecycle: Create → Use → Discard
```

### Category 4: Persistent Artifacts
**Examples:** GeneratedTypeScriptArtifact, SemanticTypesArtifact

**Characteristics:**
- Immutable after creation
- Stored in registry
- Passed between pipeline stages
- May be serialized

**Ownership pattern:**
```typescript
Owner: Producer pass
Mutators: None (immutable)
Lifecycle: Produce → Register → Consume → Archive
```


### Category 5: Shared Type System Primitives
**Examples:** SemanticType, TypeReference, Constraints

**Characteristics:**
- Foundational (no owner)
- Used everywhere
- Immutable by design
- Cannot be removed

**Ownership pattern:**
```typescript
Owner: Type system (conceptual)
Mutators: None
Lifecycle: Entire compilation
Risk: Critical (removal breaks everything)
```

---

## Ownership Analysis Checklist

Before adding new data structure, answer:

### Design Phase
- [ ] What category does this data belong to?
- [ ] Who will own this data?
- [ ] Who can create it?
- [ ] Who can modify it?
- [ ] Is it immutable or mutable?
- [ ] What's its lifecycle?
- [ ] When does it become final?

### Implementation Phase
- [ ] Ownership documented in code
- [ ] Creation restricted to authorized components
- [ ] Mutation control enforced (readonly/freeze)
- [ ] Lifecycle clearly defined
- [ ] Finalization point identified

### Integration Phase
- [ ] Layer access boundaries defined
- [ ] Consumers identified
- [ ] Dependencies mapped
- [ ] Deletion impact analyzed

### Documentation Phase
- [ ] Ownership documented
- [ ] Lifecycle documented
- [ ] Usage patterns documented
- [ ] Examples provided

---

## Common Ownership Anti-Patterns

### ❌ Anti-Pattern 1: Unclear Ownership

```typescript
// BAD: Who owns this?
let sharedState = { data: [] }

function processA() {
  sharedState.data.push(...)  // Mutates
}

function processB() {
  sharedState.data.push(...)  // Also mutates
}
```

**Problem:** No clear owner, race conditions, hard to reason about

**Fix:**
```typescript
// GOOD: Clear ownership
class DataRegistry {
  private data: Data[] = []  // Owner: DataRegistry
  
  add(item: Data): void {  // Controlled mutation
    this.data.push(item)
  }
  
  getAll(): readonly Data[] {  // Read-only access
    return this.data
  }
}
```


### ❌ Anti-Pattern 2: Uncontrolled Mutation

```typescript
// BAD: Artifact can be mutated after creation
interface UserArtifact {
  name: string
  props: Property[]
}

const artifact: UserArtifact = createArtifact()
artifact.name = 'changed'  // Allowed!
artifact.props.push(...)   // Allowed!
```

**Problem:** No immutability guarantees, hard to cache, race conditions

**Fix:**
```typescript
// GOOD: Immutable artifact
interface UserArtifact {
  readonly name: string
  readonly props: readonly Property[]
}

const artifact: UserArtifact = Object.freeze(createArtifact())
artifact.name = 'changed'  // Compile error
```

### ❌ Anti-Pattern 3: Unclear Lifecycle

```typescript
// BAD: When is this valid?
function processData() {
  const data = loadData()
  // ... processing ...
  // Is data still valid here?
  useData(data)
}
```

**Problem:** Unclear when data becomes stale

**Fix:**
```typescript
// GOOD: Explicit lifecycle
function processData() {
  const data = loadData()  // Valid from here
  
  const result = transform(data)
  
  // data invalidated, use result instead
  useData(result)
}
```

### ❌ Anti-Pattern 4: Mixed Source of Truth

```typescript
// BAD: Two sources of same information
const userTypes = new Map<string, Type>()  // Source 1
const typeRegistry = new TypeRegistry()    // Source 2

// Which one is authoritative?
```

**Problem:** Inconsistency, synchronization bugs

**Fix:**
```typescript
// GOOD: Single source of truth
class TypeRegistry {  // THE source
  private types = new Map<string, Type>()
  
  // All access through registry
  register(type: Type): void
  get(name: string): Type
}

// Other components derive from this
const userTypes = typeRegistry.getUserTypes()
```


### ❌ Anti-Pattern 5: Layer Leakage

```typescript
// BAD: Internal data structure exposed to CLI
// In core/compiler:
export class InternalCompilerState { ... }

// In CLI:
import { InternalCompilerState } from '@core/compiler'
function generateCode(state: InternalCompilerState) { ... }
```

**Problem:** CLI depends on internal implementation details

**Fix:**
```typescript
// GOOD: Expose only public artifacts
// In core/compiler:
export interface GeneratedCode {  // Public API
  code: string
  imports: ImportSpec[]
}

// Internal state not exported
class InternalCompilerState { ... }

// In CLI:
import { GeneratedCode } from '@core/compiler'
function writeCode(generated: GeneratedCode) { ... }
```

---

## Ownership Decision Tree

When designing new data structure, follow this decision tree:

```
1. Is data shared across components?
   ├─ No  → Simple ownership (creator owns)
   └─ Yes → Continue to 2

2. Does data need mutation after creation?
   ├─ No  → Immutable value object
   └─ Yes → Continue to 3

3. Is mutation controlled by single component?
   ├─ Yes → That component owns it
   └─ No  → Continue to 4

4. Multiple components need mutation?
   ├─ Sequential → Use Builder pattern
   └─ Concurrent → Use Registry/Manager

5. Is data transient or persistent?
   ├─ Transient → Owned by orchestrator
   └─ Persistent → Use artifact pattern

6. Cross-layer access needed?
   ├─ No  → Keep internal
   └─ Yes → Create public interface
```

---

## Summary: Data Ownership Principles

### The 5 Golden Rules

1. **Every data structure has ONE clear owner**
   - Owner controls lifecycle
   - Owner enforces invariants
   - Owner documented explicitly

2. **Mutability is opt-in, not default**
   - Default: Immutable
   - Mutation: Explicit and controlled
   - After finalization: Never mutable

3. **Lifecycle is explicit and documented**
   - Creation point identified
   - Finalization point identified
   - Invalidation conditions stated

4. **Source of truth is singular**
   - One authoritative source
   - Derived data clearly marked
   - Synchronization strategy explicit

5. **Layer boundaries are enforced**
   - Internal data not exposed
   - Public API clearly defined
   - Cross-layer access controlled

---

## Application to RouteSync Development

**MANDATORY for all new data structures:**

1. Fill out the 10-question analysis template
2. Classify into one of 5 categories
3. Document ownership explicitly
4. Enforce mutability rules
5. Define lifecycle clearly
6. Test deletion impact

**Review criteria:**

- ✅ All 10 questions answered with evidence
- ✅ Ownership clear and documented
- ✅ Mutability appropriate for use case
- ✅ Lifecycle well-defined
- ✅ Layer boundaries respected
- ✅ Deletion impact analyzed

**This analysis is REQUIRED before:**
- Adding new artifact types
- Creating new IR structures
- Introducing shared state
- Designing pass interfaces
- Modifying compiler pipeline

---

*Last Updated: 2026-08-05*  
*Version: 1.0*  
*Status: Active - Apply to all data structure design*
