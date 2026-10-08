# IR Node Specifications

Dokumen ini mendefinisikan detail skema untuk setiap `kind` dari `IRNode`.

## 1. Operation Node (Polymorphic Endpoint)
Mewakili batas transport fisik API.

```typescript
export interface OperationNode extends IRNode {
  kind: "operation";
  symbol: string;
  protocol: HttpProtocol | GrpcProtocol | GraphQlProtocol;
  requestSchema?: NodeId; // Merujuk ke SchemaNode
  responseSchema?: NodeId; // Merujuk ke SchemaNode
}

export interface HttpProtocol {
  transport: "http";
  descriptor: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
  };
}

export interface GrpcProtocol {
  transport: "grpc";
  descriptor: {
    service: string;
    method: string;
  };
}

export interface GraphQlProtocol {
  transport: "graphql";
  descriptor: {
    query: string;
    mutation?: string;
  };
}
```

## 2. Aggregate Node
Mewakili batas konsistensi transaksional atau entitas agregat domain.

```typescript
export interface AggregateNode extends IRNode {
  kind: "aggregate";
  traitRefs: NodeId[]; // Merujuk ke TraitNode
  config: {
    collectionField: string;
    identityField: string;
    quantityField: string;
    promotionCodeField: string;
  };
}
```

## 3. Trait Node
Mewakili kemampuan abstrak domain yang dapat dikomposisi ulang.

```typescript
export interface TraitNode extends IRNode {
  kind: "trait";
  symbol: string; // Misal: "CollectionTrait"
  capabilities: Record<string, NodeId>; // Kapabilitas lokal yang memetakan aksi ke OperationNode
}
```

## 4. Workflow Node
Mewakili orkestrasi alur kerja antar-agregat (misal: Checkout).

```typescript
export interface WorkflowNode extends IRNode {
  kind: "workflow";
  steps: Array<{
    name: string;
    operation: NodeId; // Merujuk ke OperationNode
  }>;
}
```

## 5. Event Node
Mewakili pemicu atau asinkronitas rilis data (Broadcast, Webhook, Queue).

```typescript
export interface EventNode extends IRNode {
  kind: "event";
  transport: "websocket" | "sse" | "webhook";
  payloadSchema: NodeId;
}

## 6. Schema Node
Mewakili struktur tipe data logis (Zod, OpenAPI, LLM tool schemas).

```typescript
export interface SchemaNode extends IRNode {
  kind: "schema";
  type: "object" | "array" | "string" | "number" | "boolean" | "enum";
  properties?: Record<string, NodeId>; // Merujuk ke SchemaNode anak
  items?: NodeId;                      // Jika type === "array", merujuk ke SchemaNode anak
  enumOptions?: string[];              // Jika type === "enum", daftar nilai opsi
  requiredFields?: string[];
}
```
```
