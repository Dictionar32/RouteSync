# Runtime Contract Specification

Runtime Contract adalah hasil ekspor final compiler yang berformat ringan untuk browser atau klien runtime.

## Struktur `routesync.runtime.ts`
Berkas ini wajib menggunakan asertasi `as const` agar tipe data literal tetap terjaga secara native:

```typescript
export const runtimeManifest = {
  domainIntentCapabilities: {
    cart: {
      kind: "domain_intent_capability",
      authority: "upstream",
      identity: "cart",
      domainName: "cart",
      intentKind: "aggregate_collection",
      aggregateCollection: {
        kind: "aggregate_collection",
        operations: {
          createItem: { operationId: "cartItems.create", resource: "cartItems", action: "create" },
          updateItem: { operationId: "cartItems.update", resource: "cartItems", action: "update" },
          removeItem: { operationId: "cartItems.remove", resource: "cartItems", action: "remove" },
          applyPromo: { operationId: "cartPromo.apply", resource: "cartPromo", action: "apply" },
          removePromo: { operationId: "cartPromo.remove", resource: "cartPromo", action: "remove" }
        },
        fields: {
          collectionField: "items",
          identityField: "produkItemId",
          quantityField: "qty",
          promotionCodeField: "code"
        }
      },
      closed: true
    }
  }
} as const;
```
