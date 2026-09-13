/**
 * zodEmitter.ts
 *
 * Emits ZodAST from SemanticIRNode and resource fields.
 *
 * @module sdk/generator
 */

import {
  type SemanticIRNode,
  type ParsedResource,
  type ResourceFieldDescriptor,
  type ZodAST,
  ZodObjectShape,
  isObject,
  hasProperty
} from '@routesync/core';

export class ZodEmitter {
  static from(node: SemanticIRNode | undefined, resources: readonly ParsedResource[] = []): ZodAST {
    if (!node || !node.semantic) return { kind: "zod_unknown" };

    const semanticType = node.semantic.type;
    if (semanticType === "model" || (isObject(node.semantic) &&
      hasProperty(node.semantic, 'type') && node.semantic.type === "object")) {
      let shape: ZodObjectShape = ZodObjectShape.empty();
      if (node.semantic.model) {
        const resource = resources.find(r => r.name === node.semantic!.model || r.name === node.semantic!.model + 'Resource');
        if (resource) {
          shape = ZodObjectShape.fromRecord(this.fromObject(resource.fields, resources));
        }
      }
      return { kind: "zod_object", shape };
    }

    if (node.semantic.type === "number") return { kind: "zod_number" };
    if (node.semantic.type === "string") return { kind: "zod_string" };
    if (node.semantic.type === "boolean") return { kind: "zod_boolean" };
    if (node.semantic.type === "array" || node.semantic.collection) {
      return { kind: "zod_array", element: { kind: "zod_unknown" } };
    }

    return { kind: "zod_unknown" };
  }

  static fromObject(fields: readonly ResourceFieldDescriptor[] | Record<string, unknown>, resources: readonly ParsedResource[] = []): Record<string, ZodAST> {
    const shape: Record<string, ZodAST> = {};
    if (Array.isArray(fields)) {
      for (const field of fields) {
        shape[field.name] = { kind: "zod_unknown" };
      }
      return shape;
    }
    for (const [key, value] of Object.entries(fields)) {
      if (value && typeof value === 'object' && 'semantic' in value) {
        shape[key] = this.from(value as SemanticIRNode, resources);
      } else {
        shape[key] = { kind: "zod_unknown" };
      }
    }
    return shape;
  }
}
