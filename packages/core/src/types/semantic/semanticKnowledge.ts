/**
 * semanticKnowledge.ts
 *
 * Typed knowledge model for compiler decisions that previously lived as
 * scattered if/===/switch branches.  Consumers interpret these facts; they
 * do not redefine the domain knowledge.
 */

import type { ExecutionLayer } from './modelGraphTypes';
import { PrimitiveKind } from '../domain/semanticType';

export interface ExecutionLayerKnowledge {
  readonly layer: ExecutionLayer;
  readonly pathFragments: readonly string[];
  readonly fileSuffixes: readonly string[];
}

export interface ParameterTypeKnowledge {
  readonly fragments: readonly string[];
  readonly primitive: PrimitiveKind;
}


export const EXECUTION_LAYER_KNOWLEDGE: readonly ExecutionLayerKnowledge[] = Object.freeze([
  { layer: 'controller', pathFragments: ['Controller.php'], fileSuffixes: ['Controller.php'] },
  { layer: 'service', pathFragments: ['Service.php'], fileSuffixes: ['Service.php'] },
  { layer: 'model', pathFragments: ['Models/'], fileSuffixes: ['Model.php'] }
]);

export const PARAMETER_TYPE_KNOWLEDGE: readonly ParameterTypeKnowledge[] = Object.freeze([
  { fragments: ['id', 'Id'], primitive: PrimitiveKind.NUMBER },
  { fragments: ['slug', 'uuid', 'Uuid'], primitive: PrimitiveKind.STRING }
]);

