/**
 * index.ts
 *
 * Field type resolver domain exports.
 *
 * @module core/ir/domain/field-type
 */

export {
    transformFieldName,
    projectForForm
} from './fieldTransform';

export { convertToLegacyFieldIR } from './legacyConverter';
export { convertSemanticToTypeIR } from './semanticTypeConverter';
