# Compiler.ts Migration Plan

## Tujuan
Memindahkan semua komponen dari `packages/core/src/compiler.ts` (1512 lines) ke struktur folder yang terorganisir di `packages/core/src/compiler/`.

## Status Saat Ini
- File `compiler.ts` berisi 1512 baris kode dengan berbagai komponen compiler
- Struktur folder sudah ada tapi masih kosong untuk beberapa folder
- Beberapa komponen sudah ada di folder yang tepat (IR, Types, Utils, Cache)

## Rencana Pemindahan

### 1. Analysis Components → `compiler/analysis/`
**File yang akan dibuat:**
- `CFGAnalysis.ts` - Control Flow Graph operations
- `DominatorAnalysis.ts` - Dominator Tree & Dominance Frontier
- `SSAAnalysis.ts` - SSA Builder, Renamer, Representation
- `LoopAnalysis.ts` - Loop detection & normalization
- `DataFlowAnalysis.ts` - Generic data flow framework
- `UseDefAnalysis.ts` - Use-Def chains
- `SymbolAnalysis.ts` - Symbol database & graph
- `AliasAnalysis.ts` - Pointer alias analysis
- `EffectAnalysis.ts` - Instruction effect analysis
- `AnalysisManager.ts` - Analysis caching & invalidation
- `index.ts` - Public exports

**Komponen yang dipindahkan:**
```typescript
// From compiler.ts
- DataFlowAnalysis
- DominatorTree
- DominanceFrontier
- LoopAnalysis
- LoopInfo
- SymbolDatabase
- SymbolNode
- SSARepresentation
- SSABasicBlock
- SSABuilder
- SSARenamer
- UseDefGraph
- AnalysisKey
- AnalysisManager
- AnalysisDependencyGraph
- CFGAnalysis (constant)
- DominatorsAnalysis (constant)
- LoopInfoAnalysis (constant)
- SSAAnalysis (constant)
- UseDefAnalysis (constant)
- AliasAnalysis
- EffectAnalysis (interface)
```

### 2. Optimization Components → `compiler/optimization/`
**File yang akan dibuat:**
- `SSAOptimizer.ts` - SSA-based optimizations
- `OptimizationPipeline.ts` - Optimization orchestration
- `PhiElimination.ts` - Phi node elimination
- `CopyCoalescing.ts` - Copy propagation & coalescing
- `LICM.ts` - Loop-invariant code motion
- `DeadCodeElimination.ts` - Dead code removal
- `ConstantFolding.ts` - Constant folding
- `OptimizationPass.ts` - Pass interface & utilities
- `InstructionEffects.ts` - Instruction effect analysis for optimization
- `index.ts` - Public exports

**Komponen yang dipindahkan:**
```typescript
// From compiler.ts
- SSAOptimizer
- OptimizationPipeline
- PhiEliminator
- CopyCoalescer
- LICMOptimizer
- LoopNormalizer
- OptimizationPass (interface)
- InstructionEffect (type)
- getInstructionEffect()
- isSpeculatable()
```

### 3. Query System → `compiler/query/`
**File yang akan dibuat:**
- `QueryDatabase.ts` - Query execution & caching
- `MemoizedQuery.ts` - Memoization system
- `SalsaCompiler.ts` - Salsa-style incremental compilation
- `QueryKey.ts` - Query key types & utilities
- `QueryNode.ts` - Query graph node
- `QueryContext.ts` - Query execution context
- `QueryCycleError.ts` - Cycle detection
- `index.ts` - Public exports

**Komponen yang dipindahkan:**
```typescript
// From compiler.ts
- QueryCell
- MemoizedQueryKey
- createMemoizedQueryKey()
- TypedCache
- QueryDescriptor
- QueryDatabase
- MemoizedQueryDatabase
- QueryKey (interface)
- QueryNode
- QueryContext
- QueryFrame
- QueryCycleError
- SalsaCompiler
```

### 4. Verification Components → `compiler/verification/`
**File yang akan dibuat:**
- `Verifier.ts` - Base verifier class
- `VerifierManager.ts` - Verifier orchestration
- `CFGVerifier.ts` - CFG invariant verification
- `SSAVerifier.ts` - SSA form verification
- `VerificationContext.ts` - Verification context types
- `index.ts` - Public exports

**Komponen yang dipindahkan:**
```typescript
// From compiler.ts
- VerifierPhase (enum)
- VerificationContext (interface)
- Verifier (abstract class)
- VerifierManager
- CFGVerifier
- SSAVerifier
```

### 5. Emitter Components → `compiler/emitters/`
**File yang akan dibuat:**
- `ContractEmitter.ts` - Base emitter interface
- `TypeScriptEmitter.ts` - TypeScript code generation
- `BackendCapability.ts` - Backend capability types
- `GeneratedArtifact.ts` - Output artifact types
- `ContractVisitor.ts` - Visitor pattern for contracts
- `index.ts` - Public exports

**Komponen yang dipindahkan:**
```typescript
// From compiler.ts
- GeneratedArtifact (interface)
- BackendCapability (interface)
- ContractEmitter (interface)
- TypeScriptEmitter (class)
- ContractVisitor (interface - jika ada)
```

### 6. Arena & Storage → `compiler/utils/`
**File yang sudah ada, perlu update:**
- Tambahkan ke `utils/Arena.ts`:
  - Arena<T>
  - ASTNodeId
  - ASTNodeData
  - ASTArena

**Komponen yang dipindahkan:**
```typescript
// From compiler.ts
- Arena<T>
- ASTNodeId (type)
- ASTNodeData (interface)
- ASTArena
```

### 7. IR Components → `compiler/ir/`
**Sudah ada tapi perlu tambahan:**
- Update file yang ada
- Pastikan tidak ada komponen IR yang masih di compiler.ts

### 8. Pass Manager → `compiler/passes/`
**File yang sudah ada, perlu update:**
- `PassResult.ts` - Pass result interface

**Komponen yang dipindahkan:**
```typescript
// From compiler.ts
- PassResult (interface)
```

## Prioritas Eksekusi

### Phase 1: Foundation (High Priority)
1. ✅ Arena & Storage → `utils/Arena.ts`
2. ✅ Emitter Components → `emitters/`
3. ✅ Pass Result → `passes/PassResult.ts`

### Phase 2: Core Analysis (High Priority)
4. CFG & Dominator → `analysis/`
5. SSA Components → `analysis/`
6. Loop Analysis → `analysis/`
7. Use-Def Analysis → `analysis/`

### Phase 3: Advanced Features (Medium Priority)
8. Query System → `query/`
9. Optimization Components → `optimization/`
10. Symbol Database → `analysis/SymbolAnalysis.ts`
11. Data Flow Framework → `analysis/DataFlowAnalysis.ts`

### Phase 4: Verification (Medium Priority)
12. Verifier Components → `verification/`

### Phase 5: Cleanup (Low Priority)
13. Update all imports di seluruh codebase
14. Update exports di `compiler/index.ts`
15. Hapus `compiler.ts` yang lama
16. Update documentation

## Dependencies & Order

```
Foundation (Arena, Types)
    ↓
IR Components
    ↓
Analysis (CFG, Dominator, SSA)
    ↓
Query System & Optimization
    ↓
Verification
    ↓
Emitters
```

## Testing Strategy

1. Setiap file baru harus memiliki test
2. Import semua exports dari `compiler/index.ts` dan verify
3. Run existing tests untuk ensure tidak ada breaking changes
4. Add integration tests untuk compiler pipeline

## Migration Checklist

- [ ] Phase 1: Foundation
  - [ ] Arena & Storage
  - [ ] Emitter Components
  - [ ] Pass Result

- [ ] Phase 2: Core Analysis
  - [ ] CFG Analysis
  - [ ] Dominator Analysis
  - [ ] SSA Components
  - [ ] Loop Analysis
  - [ ] Use-Def Analysis

- [ ] Phase 3: Advanced Features
  - [ ] Query System
  - [ ] Optimization Components
  - [ ] Symbol Database
  - [ ] Data Flow Framework

- [ ] Phase 4: Verification
  - [ ] Verifier Components

- [ ] Phase 5: Cleanup
  - [ ] Update imports
  - [ ] Update exports
  - [ ] Delete old file
  - [ ] Update docs

## Notes

- Maintain backward compatibility during migration
- Keep `compiler.ts` until all components are migrated
- Export semua dari `compiler/index.ts` untuk compatibility
- Add deprecation notices di `compiler.ts`
- Update REFACTORING_PROGRESS.md setelah setiap phase
