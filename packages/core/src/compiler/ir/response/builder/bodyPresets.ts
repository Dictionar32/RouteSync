/**
 * bodyPresets.ts
 *
 * Preset constructors for response bodies and descriptors.
 *
 * @module core/compiler/ir/response/builder
 */

import type { ResponseDescriptor, ConfidenceScore } from '../responseDescriptors';
import type {
  ResponseBody,
  ResourceBody,
  ModelBody,
  PrimitiveBody,
  ObjectBody
} from '../responseBodies';
import type { ObjectSchema } from '../objectSchemas';

export interface PresetResult {
  readonly descriptor: ResponseDescriptor;
  readonly body: ResponseBody;
  readonly confidence: ConfidenceScore;
}

export function createResourcePreset(
  currentDescriptor: ResponseDescriptor,
  resourceName: string,
  modelName: string | undefined,
  shape: ResourceBody['shape'] = 'single',
  confidenceScore = 1.0,
  confidenceReason = 'Explicit resource return'
): PresetResult {
  return {
    descriptor: { ...currentDescriptor, transport: 'resource' },
    body: {
      type: 'resource',
      resource: resourceName,
      model: modelName,
      shape
    },
    confidence: {
      score: confidenceScore,
      reasons: [confidenceReason],
      method: 'explicit'
    }
  };
}

export function createModelPreset(
  currentDescriptor: ResponseDescriptor,
  modelName: string,
  shape: ModelBody['shape'] = 'single',
  confidenceScore = 0.9,
  confidenceReason = 'Inferred from model return'
): PresetResult {
  return {
    descriptor: { ...currentDescriptor, transport: 'model' },
    body: {
      type: 'model',
      model: modelName,
      shape
    },
    confidence: {
      score: confidenceScore,
      reasons: [confidenceReason],
      method: 'inferred'
    }
  };
}

export function createPrimitivePreset(
  currentDescriptor: ResponseDescriptor,
  primitiveType: PrimitiveBody['primitiveType'],
  confidenceScore = 1.0,
  confidenceReason = 'Explicit primitive return'
): PresetResult {
  return {
    descriptor: { ...currentDescriptor, transport: 'primitive' },
    body: {
      type: 'primitive',
      primitiveType,
      shape: 'single'
    },
    confidence: {
      score: confidenceScore,
      reasons: [confidenceReason],
      method: 'explicit'
    }
  };
}

export function createObjectPreset(
  currentDescriptor: ResponseDescriptor,
  schemaName: string | undefined,
  schema: ObjectSchema,
  shape: ObjectBody['shape'] = 'single',
  confidenceScore = 0.8,
  confidenceReason = 'Heuristic object inference'
): PresetResult {
  return {
    descriptor: { ...currentDescriptor, transport: 'json' },
    body: {
      type: 'object',
      schemaName,
      schema,
      shape
    },
    confidence: {
      score: confidenceScore,
      reasons: [confidenceReason],
      method: 'heuristic'
    }
  };
}
