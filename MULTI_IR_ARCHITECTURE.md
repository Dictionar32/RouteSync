# Multi-IR Architecture: Semantic vs Declaration IR

## 🎯 Clarification: Two Different IR Systems

Anda benar sekali! RouteSync sebenarnya menggunakan **dua jenis IR yang berbeda** dengan fungsi yang berbeda pula.

### ❌ Confusion Sebelumnya:
```
"routesync.ir.json = ContractIR"  (SALAH!)
```

### ✅ Reality: Two Separate IR Systems:
```
routesync.ir.json = Semantic IR    (Compiler-level)
ContractIR        = Declaration IR (Generation-level)
```

## 🏗️ Complete RouteSync Pipeline

### **Stage 1: Laravel Scanner**
```
Laravel App
     ↓ (PHP Scanner/Extractor)
Semantic IR (routesync.ir.json)
```

**Purpose**: Semantic analysis dan understanding Laravel code  
**Content**: AST nodes, semantic resolution, trace, source references

### **Stage 2: Semantic Resolver**
```
Semantic IR (routesync.ir.json)
     ↓ (Normalizer/Semantic Resolver)
Manifest (routesync.manifest.json)
```

**Purpose**: Normalisasi ke higher-level API contracts  
**Content**: Routes, resources, models yang sudah di-resolve

### **Stage 3: ContractIRBuilder**
```
Manifest (routesync.manifest.json)
     ↓ (ContractIRBuilder)
Declaration IR (memory only)
```

**Purpose**: Lowering ke generation-ready structures  
**Content**: ResourceIR, RequestIR, EndpointIR, SharedTypeIR

### **Stage 4: Emitters**
```
Declaration IR (memory)
     ↓ (6 Emitters)
Generated TypeScript Files
```

## 📊 IR Comparison Table

| Aspect | Semantic IR | Declaration IR |
|--------|-------------|----------------|
| **File** | `routesync.ir.json` | In-memory only |
| **Level** | Compiler-level | Generation-level |
| **Size** | Large (AST, traces, refs) | Small (clean structures) |
| **Purpose** | Semantic analysis | Code generation |
| **Content** | AST, traces, confidence | ResourceIR, RequestIR, TypeIR |
| **Consumers** | Normalizer, debugger | Emitters only |
| **Persistence** | Always saved | Only if `--dump-contract-ir` |

## 🔍 Semantic IR Content (routesync.ir.json)

### Rich Semantic Data:
```json
{
  "irVersion": "ir.v2",
  "nodeCount": 51,
  "nodes": {
    "route:POST:/register#response": {
      "source": {
        "file": "AuthController.php",
        "line": 26,
        "context": "route"
      },
      "node": {
        "kind": "raw_code", 
        "code": "$response"
      },
      "semantic": {
        "status": "resolved",
        "type": "model",
        "confidence": 100,
        "trace": [...]
      }
    }
  }
}
```

### Used For:
- ✅ Debugging compiler
- ✅ Incremental compilation
- ✅ Semantic analysis validation
- ✅ Source mapping
- ❌ NOT used by emitters

## 🎯 Declaration IR Content (ContractIR)

### Clean Generation Structures:
```typescript
interface ContractIR {
  resources: ResourceIR[]      // Clean resource definitions
  requests: RequestIR[]        // Form/payload structures  
  endpoints: EndpointIR[]      // API endpoint mappings
  sharedTypes: SharedTypeIR[]  // Reusable type definitions
  enums: EnumIR[]             // Enum definitions
  imports: ImportIR[]          // Import dependencies
}

interface ResourceIR {
  name: string                 // "CategoryResource"
  fields: ResourceFieldIR[]    // Clean field list
  aliases: ResourceAliasIR[]   // Type aliases (Show, Index)
  variants: ResourceVariantIR[] // Different projections
  mapper: MapperIR             // Transform functions
}
```

### Used For:
- ✅ Code generation only
- ✅ Thin emitter consumption
- ✅ Type-safe generation
- ❌ NOT for semantic analysis

## 💡 Benefits of Separation

### 1. **Clear Separation of Concerns**
```
Semantic IR:    "What does this Laravel code mean?"
Declaration IR: "How do we generate TypeScript from this?"
```

### 2. **Size Optimization**
```
Semantic IR:    Large (AST + traces + source refs)
Declaration IR: Small (only generation data)
```

### 3. **Performance Benefits**
```
Semantic IR:    Loaded once for normalization
Declaration IR: Built fresh, consumed immediately
```

### 4. **Debugging Clarity**
```
Semantic Issues:     Check routesync.ir.json
Generation Issues:   Check ContractIR with --dump-contract-ir
```

## 🚀 Renamed Architecture Stages

### **Old Confusing Names:**
```
routesync.ir.json → IR → ContractIR → Emitters
```

### **New Clear Names:**
```
Stage 1: Laravel Scanner
    ↓
Stage 2: Semantic IR (routesync.ir.json)
    ↓  
Stage 3: Manifest (routesync.manifest.json)
    ↓
Stage 4: Declaration IR (memory)
    ↓
Stage 5: Emitters
```

## 📋 Implementation Status

### ✅ Currently Implemented:
- Semantic IR → Manifest conversion
- Manifest → Declaration IR building
- Declaration IR → Emitters
- All 6 emitters working

### 🔄 Optional Enhancement:
```bash
# Debug flag untuk save Declaration IR
routesync build --dump-contract-ir

# Output: routesync.contract-ir.json
{
  "resources": [...],
  "requests": [...], 
  "endpoints": [...],
  "metadata": {
    "generatedAt": "2024-01-01T00:00:00Z",
    "stats": {...}
  }
}
```

## 🏆 Architecture Benefits

### 1. **Maintainability**
- Clear boundaries between semantic analysis dan generation
- Easier debugging (different IR untuk different problems)
- Modular architecture

### 2. **Performance** 
- Declaration IR kecil dan generation-focused
- Tidak ada overhead semantic data di emitters
- Fast in-memory processing

### 3. **Extensibility**
- New emitters cukup consume Declaration IR
- Semantic analysis terpisah dari generation logic
- Easy testing (mock Declaration IR)

### 4. **Developer Experience**
- Clear mental model: 2 different IRs for 2 different purposes
- Better error messages (semantic vs generation errors)
- Focused debugging tools

## 🎯 Conclusion

Anda sangat benar - ini adalah arsitektur yang jauh lebih bersih:

1. **Semantic IR**: Membantu compiler memahami Laravel
2. **Declaration IR**: Membantu emitters menghasilkan kode  
3. **Different abstraction levels**: Compiler-level vs Generation-level
4. **Clear separation**: Analysis vs Synthesis

**RouteSync sekarang memiliki multi-IR architecture yang proper dengan separation of concerns yang jelas!**