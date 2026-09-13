/**
 * index.ts
 *
 * Sub-domain exports for ZodToTSEmitIR converter.
 *
 * @module sdk/emitter/zod-converter
 */

export type { TSExportDefinition } from './types';
export { astToZodCode, getTsType, astToInterface } from './astToZodCode';
export { convertGeneratedModule } from './moduleConverter';
