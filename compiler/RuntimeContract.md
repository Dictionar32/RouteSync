# Runtime Contract Specification

Runtime Contract adalah hasil ekspor final compiler yang berformat ringan untuk browser atau klien runtime.

## Struktur `routesync.runtime.ts`
Berkas ini wajib menggunakan asertasi `as const` agar tipe data literal tetap terjaga secara native:

```typescript
export const runtimeManifest = {
  aggregates: {
    cart: {
      type: "AggregateCollection",
      traits: ["Collection", "Promotion"],
      capabilities: {
        items: {
          create: { operationId: "cartItems.create" }
        }
      }
    }
  }
} as const;
```
