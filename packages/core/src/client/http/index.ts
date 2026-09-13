/**
 * index.ts
 *
 * Client HTTP transformation domain exports.
 *
 * @module core/client/http
 */

export {
  isFileOrBlob,
  hasFiles,
  toFormData
} from './formDataTransformer';

export {
  prepareRequest,
  type PreparedRequest
} from './requestTransformer';
