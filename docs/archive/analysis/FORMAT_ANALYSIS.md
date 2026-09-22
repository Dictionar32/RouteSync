# Format Analysis: Manifest vs IR

## 🔍 Pertanyaan: Engine baru mengkonsumsi `routesync.ir.json`?

**Jawaban: ❌ TIDAK - Engine baru masih mengkonsumsi `routesync.manifest.json`**

## 📊 Bukti dari Kode:

### ContractGenerator Input:
```typescript
async generate(manifest: RouteManifest): Promise<GeneratedOutput>
```

### RouteManifest Interface (dari types/route.ts):
```typescript
export interface RouteManifest {
  version: string
  baseURL: string  
  routes: ParsedRoute[]
  channels?: ParsedChannel[]
  models?: ParsedModel[]
  resources?: ParsedResource[]
  // ... fields yang match dengan routesync.manifest.json
}
```

## 🔍 Perbedaan Format:

### 1. `routesync.manifest.json` (DIGUNAKAN ENGINE BARU):
```json
{
  "version": "1.0.0",
  "baseURL": "http://localhost/api",
  "routes": [
    {
      "name": "register.post",
      "method": "POST", 
      "path": "/register",
      "auth": false,
      "middleware": ["api"],
      "response": {
        "kind": "model",
        "model": "RegisterResponse"
      }
    }
  ],
  "resources": [...],
  "models": [...]
}
```

### 2. `routesync.ir.json` (TIDAK DIGUNAKAN ENGINE BARU):
```json
{
  "irVersion": "ir.v2",
  "nodeCount": 51,
  "nodes": {
    "route:POST:/register#response": {
      "id": "route:POST:/register#response",
      "source": {
        "file": "/.../AuthController.php",
        "line": 26
      },
      "node": {
        "kind": "raw_code",
        "code": ""
      },
      "semantic": {
        "status": "resolved",
        "type": "model", 
        "model": "RegisterResponse"
      }
    }
  }
}
```

## 🏗️ Arsitektur Engine Baru:

```
routesync.manifest.json
         ↓
   ContractGenerator.generate(manifest: RouteManifest)
         ↓
   ContractIRBuilder.buildFromManifest(manifest)
         ↓
   ContractIR (internal representation)
         ↓
   6 Emitters (ReadEmitter, FormEmitter, etc.)
         ↓
   Generated TypeScript files
```

## 📋 Kesimpulan:

1. **✅ Engine baru MASIH menggunakan `routesync.manifest.json`**
2. **❌ Engine baru TIDAK menggunakan `routesync.ir.json`**
3. **🔄 Internal transformation**: `RouteManifest → ContractIR → Generated Files`
4. **📊 IR format**: Engine baru membuat internal ContractIR dari manifest, bukan membaca IR yang sudah ada

## 🤔 Mengapa Tidak Menggunakan `routesync.ir.json`?

### Format `routesync.ir.json` adalah:
- **Node-based representation** dengan semantic analysis results
- **Raw code fragments** dan source locations
- **Fine-grained semantic resolution** per field/property
- **More complex structure** dengan node dependencies

### Format `routesync.manifest.json` adalah:
- **Higher-level abstraction** dengan routes, resources, models
- **Structured data** yang sudah di-normalize
- **Easier to consume** untuk generation purposes
- **Focuses on API contracts** bukan implementation details

## 🚀 Benefit dari Menggunakan Manifest:

1. **Simpler Input Processing**: Manifest sudah structured untuk generation
2. **Cleaner Separation**: IR file untuk semantic analysis, Manifest untuk generation
3. **Easier Testing**: Manifest format lebih mudah di-mock untuk testing
4. **Better Performance**: Tidak perlu parse complex IR node structure

## 💡 Workflow Lengkap RouteSync:

```
Laravel App
     ↓
PHP Scanner/Extractor
     ↓
routesync.ir.json (semantic analysis results)
     ↓
Normalizer/Compiler
     ↓
routesync.manifest.json (structured for generation)
     ↓
ContractGenerator (engine baru)
     ↓
Generated TypeScript files
```

**Engine baru berada di tahap akhir pipeline, mengkonsumsi manifest yang sudah di-normalize dari IR.**