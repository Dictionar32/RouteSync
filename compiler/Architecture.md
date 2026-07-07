# RouteSync Compiler Architecture Specification
Version: 2.0.0-draft

## Visi Resmi RouteSync
> "Compile Laravel applications into a typed semantic contract that can be executed by multiple runtimes."

## Konstitusi Utama RouteSync Compiler
> [!IMPORTANT]
> **Generator tidak boleh melakukan inferensi semantik.** Semua inferensi, resolusi, dan optimasi harus selesai di Middle-end. Backend generator hanya boleh membaca IR dan menghasilkan artefak target.

## Pipeline Kompilasi
Kompilasi RouteSync dipecah menjadi tiga fase utama:

```
[ Laravel Application Source Code ]
                │
                ▼
        [ Frontend Parser ]
                │
                ▼
          [ AST Graph ]
                │
                ▼
      [ Pass Manager (Optimizer) ]  <── Plugins
                │
                ▼
       [ Contract Graph IR ]
                │
                ▼
      [ Serialization Pass ]  ───► routesync.manifest.json (Compiler IR)
                │
                ├──────────────────────┬──────────────────────┬──────────────────────┐
                ▼                      ▼                      ▼                      ▼
    [ Runtime Contract Gen ]    [ React Backend ]       [ Vue Backend ]      [ AI Agent Backend ]
                │                      │                      │                      │
                ▼                      ▼                      ▼                      ▼
       routesync.runtime.ts         hooks.ts            composables.ts           tools.json
```
