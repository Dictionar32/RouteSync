/**
 * index.ts
 *
 * Sub-domain exports for ResponseArtifactBuilder presets, state, and factory.
 *
 * @module core/compiler/ir/response/builder
 */

export {
  type PresetResult,
  createResourcePreset,
  createModelPreset,
  createPrimitivePreset,
  createObjectPreset
} from './bodyPresets';

export {
  buildResponseArtifact
} from './artifactFactory';

export {
  type ResponseBuilderState,
  createInitialBuilderState,
  applyResourceToState,
  applyModelToState,
  applyPrimitiveToState,
  applyObjectToState
} from './builderState';

export {
  setTransport,
  setStatus,
  setContentType,
  setContentDisposition,
  setNullable,
  setConfidenceScore
} from './descriptorSetters';
