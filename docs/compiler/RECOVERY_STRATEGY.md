# Compiler Recovery Strategy

## Context

Recovery dari commit `f6d8f370` menemukan **monolithic compiler.ts** lama dengan beberapa komponen yang hilang dari arsitektur modular baru. Dokumen ini menjelaskan strategi untuk **selective recovery** - mengambil missing pieces tanpa mengganti modular architecture.

## Recovery Philosophy

```
❌ DON'T: Replace modular compiler with monolithic version
✅ DO: Extract missing semantic pieces and integrate into modular structure
```

### Arsitektur Baru (Target - Benar)

```
packages/core/src/compiler/
├── types/
│   ├── FileSpan.ts          ✅ Offset-based (canonical)
│   ├── SemanticType.ts      ✅ Modular type system
│   └── TypeSystem.ts        ✅ Modern type operations
├── utils/
│   ├── SourceLocation.ts    ✅ LineMap utilities
│   ├── Hash.ts             ✅ Uses FileSpan.filePath
│   └── ImmutableCollections.ts ✅ Immutable data structures
├── ir/
│   ├── SemanticIR.ts       ✅ Modular IR
│   └── ContractGraph.ts    ✅ Contract representation
└── artifacts/              ✅ Compilation artifact system
```

### Compiler Lama (Recovery Source - Partial)

```
packages/core/src/compiler.ts  (monolithic)
├── FileSpan (range-based)     ❌ Wrong design (discard)
├── UnionFind                  ✅ Missing (extract)
├── ConstraintSolver helpers   ✅ Missing (extract)
├── Type inference utilities   ✅ Missing (extract)
├── AST helpers               ✅ Missing (extract)
└── Old artifact system        ❌ Superseded (discard)
```

## What to Extract (Missing Pieces)

### Status Check

After investigating the modular compiler, we found:

✅ **UnionFind**: Already exists in two locations
  - `packages/core/src/compiler/utils/Graph.ts` - Generic graph UnionFind
  - `packages/core/src/compiler/constraints/UnionFind.ts` - Constraint-specific UnionFind

✅ **ConstraintSolver**: Already exists in `packages/core/src/compiler/constraints/ConstraintSolver.ts`

❓ **Need to verify**: What semantic utilities are actually missing from old compiler.ts?

---

### Investigation Required

We need to carefully compare `compiler.ts` (monolithic) against modular structure to find:

1. **Type inference algorithms** not yet in modular compiler
2. **Semantic analysis passes** that might be missing
3. **AST transformation utilities** not in modular structure
4. **Optimization passes** from old compiler

**Next step**: Read through `packages/core/src/compiler.ts` to catalog what it contains.

---

## What to Discard (Superseded)

### 1. FileSpan (Range-Based) ❌ DISCARD

**Old definition**:
```typescript
export interface FileSpan {
    readonly file: string;
    readonly startLine: number;
    readonly startChar: number;
    readonly endLine: number;
    readonly endChar: number;
}
```

**Why discard**:
- Modular compiler uses offset-based FileSpan (canonical)
- Range-based is only for display (SourceRange)
- Hash.ts already depends on `span.filePath` (offset version)

**Replacement**: Already exists in `packages/core/src/compiler/types/FileSpan.ts`

---

### 2. Old Artifact System ❌ DISCARD

**Old artifacts**:
```typescript
// In compiler.ts
interface CompilerArtifact { /* ... */ }
class ArtifactCache { /* ... */ }
```

**Why discard**:
- Modular compiler has new artifact system in `packages/core/src/compiler/artifacts/`
- New system uses:
  - ASTArtifact
  - BoundASTArtifact
  - SemanticIRArtifact
  - ConstraintGraphArtifact
  - ContractGraphArtifact
  - Etc. (11 artifact types)

**Replacement**: Already exists in `packages/core/src/compiler/artifacts/`

---

### 3. Monolithic Pass System ❌ DISCARD

**Old pass system**:
```typescript
// In compiler.ts
class CompilerPass { /* ... */ }
class PassManager { /* ... */ }
```

**Why discard**:
- Modular compiler uses granular phase separation
- Better testability with separate modules
- Clearer dependency graph

**Replacement**: Modular phase architecture already exists

---

## Extraction Procedure

### Phase 1: Extract UnionFind (Highest Priority)

```bash
# 1. Create new file
touch packages/core/src/compiler/utils/UnionFind.ts

# 2. Copy UnionFind class from compiler.ts
# 3. Add proper TypeScript documentation
# 4. Export from packages/core/src/compiler/utils/index.ts
# 5. Write unit tests
touch packages/core/src/compiler/__tests__/UnionFind.test.ts
```

**Implementation**:
```typescript
/**
 * Union-Find (Disjoint Set Union) data structure.
 * 
 * Used for:
 * - Type constraint solving (equivalence classes)
 * - Type unification in inference
 * - Graph connected components analysis
 * 
 * Time complexity:
 * - find(): O(α(n)) amortized (inverse Ackermann)
 * - union(): O(α(n)) amortized
 * 
 * where α(n) grows extremely slowly (< 5 for practical n)
 */
export class UnionFind<T> {
    private parent = new Map<T, T>();
    private rank = new Map<T, number>();
    
    /**
     * Find representative of equivalence class containing x.
     * Uses path compression for optimization.
     */
    find(x: T): T {
        if (!this.parent.has(x)) {
            this.parent.set(x, x);
            this.rank.set(x, 0);
            return x;
        }
        
        const p = this.parent.get(x)!;
        if (p !== x) {
            // Path compression
            this.parent.set(x, this.find(p));
        }
        return this.parent.get(x)!;
    }
    
    /**
     * Merge equivalence classes containing x and y.
     * Uses union by rank for optimization.
     */
    union(x: T, y: T): void {
        const rootX = this.find(x);
        const rootY = this.find(y);
        
        if (rootX === rootY) return;
        
        // Union by rank
        const rankX = this.rank.get(rootX) ?? 0;
        const rankY = this.rank.get(rootY) ?? 0;
        
        if (rankX < rankY) {
            this.parent.set(rootX, rootY);
        } else if (rankX > rankY) {
            this.parent.set(rootY, rootX);
        } else {
            this.parent.set(rootY, rootX);
            this.rank.set(rootX, rankX + 1);
        }
    }
    
    /**
     * Check if x and y are in the same equivalence class.
     */
    connected(x: T, y: T): boolean {
        return this.find(x) === this.find(y);
    }
}
```

---

### Phase 2: Extract Constraint Solver Utilities

```bash
# 1. Create constraint solver module
mkdir -p packages/core/src/compiler/solver
touch packages/core/src/compiler/solver/ConstraintSolver.ts
touch packages/core/src/compiler/solver/index.ts

# 2. Extract constraint solving logic from compiler.ts
# 3. Integrate with existing ConstraintGraphArtifact
# 4. Write integration tests
touch packages/core/src/compiler/__tests__/ConstraintSolver.integration.test.ts
```

---

### Phase 3: Extract Type Inference Engine

```bash
# 1. Create type inference module
mkdir -p packages/core/src/compiler/inference
touch packages/core/src/compiler/inference/TypeInference.ts
touch packages/core/src/compiler/inference/index.ts

# 2. Extract inference algorithms from compiler.ts
# 3. Integrate with existing SemanticType system
# 4. Write property-based tests
touch packages/core/src/compiler/__tests__/TypeInference.test.ts
```

---

### Phase 4: Extract AST Utilities

```bash
# 1. Create AST utilities module
mkdir -p packages/core/src/compiler/ast
touch packages/core/src/compiler/ast/ASTUtils.ts
touch packages/core/src/compiler/ast/index.ts

# 2. Extract AST traversal and matching from compiler.ts
# 3. Write unit tests
touch packages/core/src/compiler/__tests__/ASTUtils.test.ts
```

---

## Integration Strategy

### 1. Gradual Integration (Recommended)

```
Step 1: Extract UnionFind → Test in isolation
Step 2: Integrate UnionFind → Test with constraint solver
Step 3: Extract constraint utilities → Test in isolation
Step 4: Integrate constraint utilities → Test full pipeline
```

### 2. Dependency Management

```typescript
// packages/core/src/compiler/solver/ConstraintSolver.ts
import { UnionFind } from '../utils/UnionFind';
import { SemanticType } from '../types/SemanticType';
import { ConstraintGraphArtifact } from '../artifacts/ConstraintGraphArtifact';

export class ConstraintSolver {
    private equivalenceClasses = new UnionFind<SemanticType>();
    
    solve(artifact: ConstraintGraphArtifact): void {
        // Use UnionFind for type equivalence
        // Integrate with existing artifact system
    }
}
```

### 3. Testing Strategy

```typescript
// packages/core/src/compiler/__tests__/integration.test.ts
describe('Compiler Integration', () => {
    test('should solve constraints using UnionFind', () => {
        const solver = new ConstraintSolver();
        const constraints = createTestConstraints();
        
        const result = solver.solve(constraints);
        
        expect(result.equivalenceClasses).toBeDefined();
        expect(result.unifiedTypes).toHaveLength(expectedCount);
    });
});
```

---

## Verification Checklist

### ✅ Before Extraction
- [ ] Read old compiler.ts thoroughly
- [ ] Identify dependencies of each component
- [ ] Check for integration points in modular compiler
- [ ] Write extraction plan for each component

### ✅ During Extraction
- [ ] Copy code with understanding (don't blindly paste)
- [ ] Update to match modular architecture conventions
- [ ] Add proper TypeScript types and documentation
- [ ] Remove deprecated patterns

### ✅ After Extraction
- [ ] Write comprehensive unit tests
- [ ] Write integration tests with existing modules
- [ ] Update compiler index.ts exports
- [ ] Update REFACTORING_PROGRESS.md
- [ ] Verify no circular dependencies
- [ ] Run full test suite

---

## Migration Path

### Current State
```
✅ Modular compiler architecture (11 modules)
✅ FileSpan offset-based design
✅ Artifact system (11 artifact types)
✅ Type system (SemanticType)
✅ IR system (SemanticIR, ContractGraph)
❌ UnionFind (missing)
❌ Constraint solver utilities (missing)
⚠️  Type inference (partial)
```

### Target State
```
✅ All modular components
✅ UnionFind extracted and tested
✅ Constraint solver complete
✅ Type inference engine complete
✅ AST utilities extracted
✅ Full test coverage
✅ Documentation complete
```

---

## Timeline Estimate

| Phase | Duration | Risk |
|-------|----------|------|
| Phase 1: UnionFind | 4 hours | 🟢 Low |
| Phase 2: Constraint Solver | 8 hours | 🟡 Medium |
| Phase 3: Type Inference | 12 hours | 🟡 Medium |
| Phase 4: AST Utils | 6 hours | 🟢 Low |
| Integration & Testing | 10 hours | 🟡 Medium |
| **Total** | **2-3 days** | **🟡 Medium** |

---

## Risk Mitigation

### Risk: Breaking Existing Code
- **Mitigation**: Extract to new files, don't modify existing modules
- **Verification**: Run full test suite after each extraction

### Risk: Incompatible Design Patterns
- **Mitigation**: Adapt old code to match modular architecture
- **Verification**: Code review with architecture documentation

### Risk: Missing Context
- **Mitigation**: Read surrounding code in compiler.ts
- **Verification**: Write comprehensive tests

---

## Success Criteria

1. ✅ UnionFind extracted and fully tested
2. ✅ Constraint solver using UnionFind
3. ✅ Type inference engine operational
4. ✅ AST utilities integrated
5. ✅ All tests passing
6. ✅ No circular dependencies
7. ✅ Documentation complete
8. ✅ Performance benchmarks maintained

---

## References

- **Old compiler**: `packages/core/src/compiler.ts` (commit f6d8f370)
- **Modular architecture**: `packages/core/src/compiler/`
- **FileSpan design**: `docs/compiler/FILE_SPAN_ARCHITECTURE.md`
- **Refactoring progress**: `packages/core/src/compiler/REFACTORING_PROGRESS.md`
