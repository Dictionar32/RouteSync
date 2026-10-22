/**
 * index.ts
 *
 * Sub-domain exports for controller scanner.
 *
 * @module core/compiler/scanner/subscanners/controller
 */

export {
  detectResourceResponse,
  detectModelResponse,
  detectInlineResponse
} from './responseDetector';
export type { ControllerBodyEvidenceProjection } from './controllerBodyResolver';

export type { ControllerDataflowContract, ControllerResourceBinding } from "./controllerDataflowContract";
