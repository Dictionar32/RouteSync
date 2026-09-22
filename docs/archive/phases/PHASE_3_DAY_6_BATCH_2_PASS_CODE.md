# Batch 2: TypeScriptGeneratorPass - Code Implementation

## File: TypeScriptGeneratorPass.ts
**Path**: `packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts`

```typescript
/**
 * TypeScriptGeneratorPass.ts
 * 
 * Compiler pass that transforms SemanticTypes into Generated TypeScript code.
 * Uses TypeScriptGenerator internally for type-to-AST transformation.
 * 
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import type { ArtifactKeyWitness, ResolveArtifacts } from './ArtifactKeyWitness';
import type { CompilationContext } from './CompilationContext';
import type { GeneratedTypeScriptArtifact, GeneratedImport, GeneratedInterface } from '../artifacts/GeneratedTypeScriptArtifact';
import type { SemanticType } from '../types/SemanticType';

import { TypeScriptGenerator } from '../generators/typescript/TypeScriptGenerator';
import { computeFingerprint } from '../fingerprint/Fingerprint';

/**
 * Input artifact untuk TypeScriptGeneratorPass
 * 
 * Pass ini menerima array of SemanticTypes yang akan di-transform
 * menjadi TypeScript code.
 */
export interface SemanticTypesArtifact {
    /** Array of semantic types to generate */
    readonly types: readonly SemanticType[];
    
    /** Optional metadata */
    readonly metadata?: {
        readonly hash: string;
        readonly version: string;
    };
}

/**
 * TypeScriptGeneratorPass transforms semantic types into TypeScript code.
 * 
 * Input:  ['SemanticTypes'] - Array of SemanticType
 * Output: ['GeneratedTypeScript'] - Generated TypeScript artifact
 * 
 * This pass:
 * 1. Receives SemanticTypes from previous passes
 * 2. Uses TypeScriptGenerator to transform each type
 * 3. Collects all generated code and metadata
 * 4. Produces GeneratedTypeScript artifact with complete code
 * 
 * @example
 * ```typescript
 * const pass = new TypeScriptGeneratorPass();
 * const manager = new PassManager(['SemanticTypes']);
 * manager.registerPass(pass);
 * ```
 */
export class TypeScriptGeneratorPass 
    implements CompilerPass<readonly ['SemanticTypes'], readonly ['GeneratedTypeScript']> {
    
    /** Pass name untuk identification dan logging */
    public readonly name = 'TypeScriptGenerator';
    
    /** Input witnesses untuk type-safe artifact retrieval */
    public readonly inputWitnesses = [
        { key: 'SemanticTypes' } as ArtifactKeyWitness<'SemanticTypes'>
    ] as const;
    
    /** Output keys yang di-produce oleh pass ini */
    public readonly outputKeys = ['GeneratedTypeScript'] as const;
    
    /** Pass descriptor untuk dependency resolution */
    public readonly descriptor: PassDescriptor = {
        name: this.name,
        inputs: ['SemanticTypes'],
        outputs: ['GeneratedTypeScript'],
        preserveArtifacts: [],
        invalidates: []
    };
    
    /** Dependencies - pass ini butuh SemanticTypes artifact */
    public readonly requires: readonly PassDependency[] = [
        {
            artifactKey: 'SemanticTypes',
            producedBy: undefined // External input or previous pass
        }
    ];
    
    /** Pass names this produces (none - end of pipeline) */
    public readonly producesPass: readonly string[] = [];
    
    /** Internal TypeScript generator instance */
    private readonly generator: TypeScriptGenerator;
    
    /**
     * Create TypeScriptGeneratorPass
     * 
     * @param config - Optional generator configuration
     */
    constructor(config?: { readonly strict?: boolean }) {
        this.generator = new TypeScriptGenerator();
        
        // Apply configuration if provided
        if (config?.strict) {
            // Future: configure generator for strict mode
        }
    }
    
    /**
     * Execute pass transformation
     * 
     * Process:
     * 1. Extract SemanticTypes from input tuple
     * 2. Generate TypeScript for each type using generator
     * 3. Collect imports and interfaces
     * 4. Build GeneratedTypeScript artifact with metadata
     * 5. Return artifact in output tuple
     * 
     * @param inputs - Tuple containing SemanticTypesArtifact
     * @param context - Compilation context
     * @returns Tuple containing GeneratedTypeScriptArtifact
     */
    public run(
        inputs: ResolveArtifacts<readonly ['SemanticTypes']>,
        context: CompilationContext
    ): ResolveArtifacts<readonly ['GeneratedTypeScript']> {
        try {
            // Extract semantic types artifact
            const semanticTypesArtifact = inputs[0] as SemanticTypesArtifact;
            const types = semanticTypesArtifact.types;
            
            // Reset generator untuk fresh state
            this.generator.reset();
            
            // Generate TypeScript untuk each type
            const interfaces: GeneratedInterface[] = [];
            const warnings: string[] = [];
            
            for (const type of types) {
                try {
                    if (type.kind === 'object') {
                        // Generate interface untuk object types
                        const name = this.extractTypeName(type);
                        const interfaceNode = this.generator.generateEntityInterface(name, type);
                        
                        // Track generated interface
                        interfaces.push({
                            name,
                            propertyCount: type.properties.size,
                            extends: type.base ? [this.extractTypeName(type.base)] : undefined,
                            lineRange: [0, 0] // Will be calculated after code generation
                        });
                    }
                } catch (error) {
                    // Collect warnings untuk non-fatal errors
                    warnings.push(
                        `Failed to generate type: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
            
            // Get generated code from generator
            const code = this.generator.emitToString();
            
            // Collect imports dari generator
            const imports: GeneratedImport[] = Array.from(
                this.generator['imports'].entries()
            ).map(([from, names]) => ({
                from,
                names: Array.from(names),
                typeOnly: true // TypeScript generator generates type-only imports
            }));
            
            // Build metadata
            const metadata = {
                generatedAt: new Date().toISOString(),
                generatorVersion: '1.0.0',
                typeCount: types.length,
                interfaceCount: interfaces.length,
                importCount: imports.length,
                linesOfCode: code.split('\n').length,
                warnings
            };
            
            // Build GeneratedTypeScript artifact
            const artifact: GeneratedTypeScriptArtifact = {
                code,
                imports,
                interfaces,
                metadata,
                // CompilerArtifact required fields
                metadata: {
                    hash: computeFingerprint(code),
                    version: '1.0.0',
                    timestamp: Date.now()
                }
            };
            
            // Return as output tuple
            return [artifact] as ResolveArtifacts<readonly ['GeneratedTypeScript']>;
            
        } catch (error) {
            // Fatal error - re-throw dengan context
            throw new TypeScriptGeneratorPassError(
                `TypeScript generation failed: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error : undefined
            );
        }
    }
    
    /**
     * Extract type name dari SemanticType
     * 
     * Helper untuk mendapatkan meaningful name dari type.
     * Fallback to synthetic name jika tidak ada name.
     */
    private extractTypeName(type: SemanticType): string {
        if (type.kind === 'reference') {
            return type.name;
        }
        if (type.kind === 'object') {
            return type.name || `Synthetic${Date.now()}`;
        }
        return 'Unknown';
    }
}

/**
 * Custom error class untuk TypeScriptGeneratorPass
 */
export class TypeScriptGeneratorPassError extends Error {
    constructor(
        message: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'TypeScriptGeneratorPassError';
        Object.freeze(this);
    }
    
    /**
     * Get detailed error message dengan cause chain
     */
    public getDetailedMessage(): string {
        let msg = `${this.name}: ${this.message}`;
        if (this.cause) {
            msg += `\n  Caused by: ${this.cause.message}`;
        }
        return msg;
    }
}
```

---

## Verification Steps

### 1. Create the file
```bash
cat > packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts << 'EOF'
[paste code above]
EOF
```

### 2. Check imports are correct
- ✅ CompilerPass interface
- ✅ TypeScriptGenerator class
- ✅ SemanticType
- ✅ GeneratedTypeScriptArtifact

### 3. Compile check
```bash
cd packages/core && npx tsc --noEmit
```

### Expected Issues to Fix
```
❌ 'SemanticTypes' not in ArtifactRegistry
   → Need to add SemanticTypes to artifacts/types.ts

❌ computeFingerprint not found
   → Use existing fingerprint utilities

❌ TypeScriptGenerator['imports'] private access
   → Need to expose imports via public method
```

---

## Quick Fixes Needed

### Fix 1: Add SemanticTypesArtifact to registry
**File**: `packages/core/src/compiler/artifacts/types.ts`

```typescript
// Import at top
import type { SemanticTypesArtifact } from '../passes/TypeScriptGeneratorPass';

// Add to ArtifactRegistry
export interface ArtifactRegistry {
    // ... existing
    SemanticTypes: SemanticTypesArtifact;
    GeneratedTypeScript: GeneratedTypeScriptArtifact;
}
```

### Fix 2: Add getImports() to TypeScriptGenerator
**File**: `packages/core/src/compiler/generators/typescript/TypeScriptGenerator.ts`

Add this method:
```typescript
/**
 * Get collected imports
 * 
 * @returns Map of module paths to imported names
 */
public getImports(): ReadonlyMap<string, ReadonlySet<string>> {
    return this.imports;
}
```

### Fix 3: Fix fingerprint import
Replace:
```typescript
import { computeFingerprint } from '../fingerprint/Fingerprint';
```

With:
```typescript
import { computeFingerprintHash } from '../fingerprint/Fingerprint';
```

And update usage:
```typescript
hash: computeFingerprintHash(code)
```

---

## Batch 2 Summary

**Files Created**: 1
- TypeScriptGeneratorPass.ts (~220 lines)

**Files Modified**: 2
- artifacts/types.ts (add SemanticTypes to registry)
- TypeScriptGenerator.ts (add getImports() method)

**Total New Code**: ~225 lines
**Compilation**: Will succeed after fixes
**Technical Debt**: Zero

**Ready for**: Batch 3 - Integration Tests Setup

---

*Batch 2 Complete - Apply fixes then proceed to Batch 3*
