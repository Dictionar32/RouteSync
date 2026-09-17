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
export { scanControllerAction } from './actionScanner';
export { resolveControllerBody } from './controllerBodyResolver';
