# Compiler Verification

Directory ini berisi **verification passes** yang memvalidasi correctness dari compiler IR dan memastikan invariants tidak dilanggar selama compilation.

## Filosofi Verification

Verification adalah **safety net** compiler. Sebelum generate code atau apply optimizations, verification passes memastikan:

1. **IR Structure Valid**: CFG well-formed, tidak ada dangling references
2. **SSA Properties Maintained**: Setiap variable defined exactly once, domination properties benar
3. **Invariants Not Violated**: Optimizations tidak break fundamental compiler assumptions

**Golden Rule**: Verification tidak mengubah IR. Verification **hanya check** dan **throw error** jika ada masalah.

---

## Mengapa Perlu Verification?

### Tanpa Verification:
```typescript
// Optimization pass accidentally creates invalid IR
optimizer.moveInstruction(inst, newBlock);
// ❌ Forgot to update predecessor/successor edges
// ❌ CFG sekarang broken, tapi tidak ada yang tahu
// ❌ Code generation produces wrong output
```

### Dengan Verification:
```typescript
// Optimization pass
optimizer.moveInstruction(inst, newBlock);

// Verification catches error
verifier.verify(cfg);
// ✅ Throws: "CFG Invariant violated: block X points to non-existent successor Y"
// ✅ Bug caught sebelum code generation
```

---

## File-file dalam Verification Layer

### 1. Verifier.ts - Base Class

**Tujuan**: Abstract base class untuk semua verification passes.

**Struktur:**
```typescript
abstract class Verifier {
  abstract readonly phase: VerifierPhase;
  abstract verify(context: VerificationContext): void;
}
```

**Kapan Dipakai:**
- Extend class ini ketika membuat verifier baru
- Implement `verify()` method untuk check specific invariants

**Example Custom Verifier:**
```typescript
class MyCustomVerifier extends Verifier {
  public readonly phase = VerifierPhase.PreOptimization;
  
  public verify(context: VerificationContext): void {
    const cfg = context.cfg;
    
    // Check custom invariant
    for (const [blockId, block] of cfg.blocks) {
      if (block.instructions.length > 1000) {
        throw new Error(
          `Custom Invariant violated: block ${blockId} has too many instructions`
        );
      }
    }
  }
}
```

---

### 2. VerifierManager.ts - Orchestration

**Tujuan**: Manage dan execute verification passes di berbagai compilation phases.

**Cara Kerja:**
1. Register verifiers
2. Run verifiers at appropriate phases
3. Collect dan report errors

**Usage:**
```typescript
// Setup verifier manager
const manager = new VerifierManager();
manager.register(new CFGVerifier());
manager.register(new SSAVerifier());

// Run verification setelah parsing
manager.runPhase(VerifierPhase.PreOptimization, context);

// Run verification setelah optimizations
manager.runPhase(VerifierPhase.PostOptimization, context);

// Final check sebelum code emission
manager.verifyAll(context);
```

**Error Handling:**
```typescript
try {
  manager.runPhase(VerifierPhase.PreOptimization, context);
} catch (error) {
  console.error('Verification failed:', error.message);
  // Example output:
  // "Verification failed in phase PreOptimization: 
  //  CFG Invariant violated: entry block has predecessor blocks"
}
```

**Kapan Dipakai:**
- Di compiler pipeline setelah setiap major phase
- Sebelum apply optimizations (PreOptimization)
- Setelah apply optimizations (PostOptimization)
- Sebelum code generation (Final)

---

### 3. VerificationContext.ts - Context Data

**Tujuan**: Provide data structures needed untuk verification.

**Struktur:**
```typescript
interface VerificationContext {
  readonly cfg: ControlFlowGraph;        // Always required
  readonly dom?: DominatorTree;          // For SSA verification
  readonly ssa?: SSARepresentation;      // For SSA verification
  readonly manager?: AnalysisManager;    // For accessing analyses
}
```

**Verification Phases:**
```typescript
enum VerifierPhase {
  PreOptimization = 'PreOptimization',    // Sebelum optimization passes
  PostOptimization = 'PostOptimization',  // Setelah optimization passes
  Final = 'Final'                          // Final check sebelum emission
}
```

**Usage:**
```typescript
const context: VerificationContext = {
  cfg: controlFlowGraph,
  dom: dominatorTree,
  ssa: ssaRepresentation
};

verifier.verify(context);
```

---

### 4. CFGVerifier.ts - Control Flow Graph Verification

**Tujuan**: Validate CFG structural invariants.

**Invariants yang Dicheck:**

1. **Entry block has no predecessors**
   ```
   Entry → Block1
     ↑        ↓
     X    Block2
   
   ❌ Entry block tidak boleh punya predecessor
   ```

2. **Exit block has no successors**
   ```
   Block1 → Exit
              ↓
              X
   
   ❌ Exit block tidak boleh punya successor
   ```

3. **Bidirectional edges**
   ```
   Block1 → Block2
   
   ✅ Block2.predecessors harus contain Block1
   ✅ Block1.successors harus contain Block2
   ```

4. **Non-empty blocks**
   ```
   Block1: []  ❌ Empty block tidak valid
   Block2: [inst1, inst2]  ✅ Valid
   ```

5. **Terminator placement**
   ```
   Block:
     inst1
     inst2
     Branch target1, target2  ← Terminator harus di akhir
   
   ❌ Tidak boleh ada instructions setelah terminator
   ```

**Usage:**
```typescript
// Via manager
const verifier = new CFGVerifier();
verifier.verify({ cfg });

// Or static method
CFGVerifier.verify(cfg);
```

**Example Errors:**
```typescript
// Error 1: Entry block punya predecessor
"CFG Invariant violated: entry block 0 has predecessor blocks"

// Error 2: Successor edge tidak bidirectional
"CFG Invariant violated: block 2 is successor of 1 but does not list it as predecessor"

// Error 3: Empty block
"CFG Invariant violated: basic block 3 is empty and lacks a terminator"

// Error 4: Terminator tidak di akhir
"CFG Invariant violated: terminator instruction is not the last instruction in block 4"
```

**Kapan Dipakai:**
- **PreOptimization**: Validate CFG sebelum optimization
- **After CFG Transformation**: Setiap kali CFG structure berubah
- **Before Code Generation**: Final check sebelum emit code

---

### 5. SSAVerifier.ts - SSA Form Verification

**Tujuan**: Validate SSA (Static Single Assignment) form invariants.

**SSA Form Requirements:**

1. **Each variable defined exactly once**
   ```typescript
   v1 = 10      // ✅ First definition
   v1 = 20      // ❌ Redefinition not allowed
   
   v2 = 30      // ✅ Each variable unique
   ```

2. **Phi nodes at block beginnings**
   ```typescript
   Block:
     v1 = Phi(v2, v3)  // ✅ Phi first
     v4 = v1 + 10      // ✅ Regular instruction after
   
   Block:
     v4 = v1 + 10      // ❌ Regular instruction first
     v5 = Phi(v6, v7)  // ❌ Phi not at beginning
   ```

3. **Uses dominated by definitions**
   ```
   Block1:
     v1 = 10
        ↓
   Block2:
     v2 = v1 + 5  ✅ v1 defined di dominator (Block1)
   
   Block3:
     v3 = v4 + 1  ❌ v4 not yet defined
   ```

4. **Phi incoming edges match predecessors**
   ```typescript
   Block2 (predecessors: [Block0, Block1]):
     v1 = Phi([Block0: v2], [Block1: v3])  // ✅ Matches
     v1 = Phi([Block0: v2])                // ❌ Missing Block1
     v1 = Phi([Block0: v2], [Block5: v3])  // ❌ Block5 not predecessor
   ```

**Usage:**
```typescript
// Via manager (requires dominator tree)
const verifier = new SSAVerifier();
verifier.verify({ cfg, dom: dominatorTree });

// Or static method
SSAVerifier.verify(cfg, dominatorTree);
```

**Example Errors:**
```typescript
// Error 1: Phi after regular instruction
"SSA Invariant violated: Phi instruction placed after non-Phi instruction in block 2"

// Error 2: Duplicate definition
"SSA Invariant violated: SSA value v3 is defined multiple times"

// Error 3: Use not dominated
"SSA Invariant violated: usage of v5 in block 4 is not dominated by its definition block 6"

// Error 4: Phi incoming mismatch
"SSA Invariant violated: Phi incoming predecessor 3 is not a predecessor of block 2"
```

**Kapan Dipakai:**
- **PostOptimization**: After SSA-based optimizations
- **After SSA Construction**: Validate SSA construction benar
- **After SSA Transformation**: Setelah modify SSA form

---

### 6. AliasAnalysis.ts - Pointer Aliasing Analysis

**Tujuan**: Determine apakah dua pointers mungkin refer ke memory location yang sama.

**Current Implementation**: Conservative analysis (assumes everything may alias).

**Usage:**
```typescript
if (AliasAnalysis.mayAlias('ptr1', 'ptr2')) {
  // Assume they may alias (conservative)
  // Cannot reorder memory operations
}
```

**Kapan Dipakai:**
- **Memory Optimization**: Determine if load/store can be reordered
- **Dead Store Elimination**: Check if store is overwritten
- **LICM**: Check if memory operation can be hoisted

**Future Enhancement:**
```typescript
// Current: Conservative
AliasAnalysis.mayAlias('ptr1', 'ptr2')  // Always returns true

// Future: Flow-sensitive
class FlowSensitiveAliasAnalysis {
  mayAlias(ptr1: string, ptr2: string, programPoint: number): boolean {
    // Precise analysis based on program point
  }
}
```

---

### 7. EffectAnalysis.ts - Side Effect Analysis

**Tujuan**: Analyze apakah instruction punya side effects (can be safely moved/removed).

**Interface:**
```typescript
interface EffectAnalysis {
  isSpeculatable(inst: Instruction): boolean;
}
```

**Speculatable Instructions:**
- **Pure**: Tidak punya side effects, result cuma depend on inputs
- **Can be moved earlier**: Tidak akan change program semantics

**Example:**
```typescript
const analysis = new DefaultEffectAnalysis();

// Pure instruction (speculatable)
const addInst = { kind: 'Assign', target: 1, value: { kind: 'Add', ... } };
console.log(analysis.isSpeculatable(addInst));  // true

// Side effect (not speculatable)
const storeInst = { kind: 'Store', address: ..., value: ... };
console.log(analysis.isSpeculatable(storeInst));  // false
```

**Kapan Dipakai:**
- **LICM (Loop Invariant Code Motion)**: Check if instruction can be hoisted
- **Dead Code Elimination**: Check if instruction can be removed
- **Instruction Scheduling**: Determine safe reordering

---

## Verification Pipeline

### Typical Compiler Pipeline dengan Verification:

```
1. Parse Source → IR
   ↓
2. ✅ CFGVerifier.verify()  (PreOptimization)
   Check: CFG structure valid
   ↓
3. Apply Optimizations
   - Dead Code Elimination
   - Loop Optimizations
   - etc.
   ↓
4. ✅ SSAVerifier.verify()  (PostOptimization)
   Check: SSA properties maintained
   ↓
5. ✅ manager.verifyAll()  (Final)
   Check: All invariants still valid
   ↓
6. Code Generation
```

### Integration dengan VerifierManager:

```typescript
class CompilerPipeline {
  private verifierManager = new VerifierManager();
  
  constructor() {
    // Register all verifiers
    this.verifierManager.register(new CFGVerifier());
    this.verifierManager.register(new SSAVerifier());
  }
  
  async compile(source: string): Promise<string> {
    // 1. Parse
    const cfg = this.parse(source);
    
    // 2. Verify pre-optimization
    this.verifierManager.runPhase(
      VerifierPhase.PreOptimization,
      { cfg }
    );
    
    // 3. Optimize
    const dom = this.buildDominatorTree(cfg);
    this.optimizationPasses.run(cfg, dom);
    
    // 4. Verify post-optimization
    this.verifierManager.runPhase(
      VerifierPhase.PostOptimization,
      { cfg, dom }
    );
    
    // 5. Final verification
    this.verifierManager.verifyAll({ cfg, dom });
    
    // 6. Generate code
    return this.generateCode(cfg);
  }
}
```

---

## Best Practices

### ✅ DO:

**1. Run verification after every major transformation**
```typescript
// After CFG modification
modifyCFG(cfg);
CFGVerifier.verify(cfg);  // ✅ Catch errors early
```

**2. Provide clear error messages**
```typescript
throw new Error(
  `SSA Invariant violated: v${value} used in block ${blockId} ` +
  `but defined in non-dominating block ${defBlock}`
);
```

**3. Use appropriate verification phases**
```typescript
// PreOptimization: Check CFG structure
manager.runPhase(VerifierPhase.PreOptimization, context);

// PostOptimization: Check SSA properties
manager.runPhase(VerifierPhase.PostOptimization, context);
```

### ❌ DON'T:

**1. Jangan skip verification di development**
```typescript
// ❌ Bad: Skip verification untuk speed
if (process.env.NODE_ENV !== 'production') {
  verifier.verify(context);
}

// ✅ Good: Always verify (bugs caught early)
verifier.verify(context);
```

**2. Jangan modify IR dalam verification**
```typescript
// ❌ Bad: Verifier mengubah IR
class BadVerifier extends Verifier {
  verify(context) {
    context.cfg.blocks.clear();  // ❌ Verifier tidak boleh mutate!
  }
}

// ✅ Good: Verifier hanya check
class GoodVerifier extends Verifier {
  verify(context) {
    if (context.cfg.blocks.size === 0) {
      throw new Error('CFG is empty');  // ✅ Throw error, jangan fix
    }
  }
}
```

**3. Jangan swallow verification errors**
```typescript
// ❌ Bad: Silent failure
try {
  verifier.verify(context);
} catch (e) {
  console.log('Verification failed, continuing anyway...');
}

// ✅ Good: Propagate errors
verifier.verify(context);  // Let it throw
```

---

## Testing Verification

### Test Invalid IR:

```typescript
describe('CFGVerifier', () => {
  test('detects entry block with predecessors', () => {
    const cfg = createInvalidCFG();
    cfg.blocks.get(cfg.entryBlock).predecessors.push(99);
    
    expect(() => {
      CFGVerifier.verify(cfg);
    }).toThrow('entry block 0 has predecessor blocks');
  });
  
  test('detects missing terminator', () => {
    const cfg = createCFG();
    cfg.blocks.get(1).instructions = [];  // Remove terminator
    
    expect(() => {
      CFGVerifier.verify(cfg);
    }).toThrow('basic block 1 is empty and lacks a terminator');
  });
});
```

---

## Performance Considerations

### Verification Overhead:

| Verifier | Complexity | Typical Time (1000 blocks) |
|----------|------------|---------------------------|
| CFGVerifier | O(V + E) | ~10ms |
| SSAVerifier | O(V + E) | ~20ms |
| AliasAnalysis | O(1) per query | ~1μs |
| EffectAnalysis | O(1) per query | ~1μs |

**Optimization Tips:**
- Run verifiers hanya di development/debug builds
- Cache verification results ketika IR tidak berubah
- Skip redundant checks kalau IR immutable

---

## Summary

Verification layer adalah **quality assurance** untuk compiler:

✅ **Catches Bugs Early**: Detect IR corruption sebelum code generation  
✅ **Validates Invariants**: Ensure compiler assumptions tidak violated  
✅ **Debug Aid**: Clear error messages help track down bugs  
✅ **Confidence**: Know IR is valid before expensive operations  

**Golden Rules:**
1. Verification **never modifies** IR (read-only)
2. Verification **throws errors** untuk invalid IR
3. Run verification **after every major transformation**
4. Provide **clear error messages** untuk debugging

---

## File Summary

| File | Tujuan | Kapan Dipakai |
|------|--------|---------------|
| **Verifier.ts** | Base class | Extend untuk custom verifiers |
| **VerifierManager.ts** | Orchestration | Run multiple verifiers di phases |
| **VerificationContext.ts** | Context data | Provide data ke verifiers |
| **CFGVerifier.ts** | CFG structure | PreOptimization phase |
| **SSAVerifier.ts** | SSA form | PostOptimization phase |
| **AliasAnalysis.ts** | Pointer aliasing | Memory optimizations |
| **EffectAnalysis.ts** | Side effects | Optimization safety checks |
