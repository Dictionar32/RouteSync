/**
 * Model Entity Sub-Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/descriptors/model/entity
 */

export {
    type ScannedModelParams
} from './types';

export {
    computeModelParams,
    computeEmptyModelParams,
    computeFromTableParams
} from './modelEntityFactory';

export {
    ScannedModelDescriptor
} from './modelDescriptorClass';
