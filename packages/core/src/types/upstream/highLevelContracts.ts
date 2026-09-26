import type { Expression } from './expression';
import type { ResourceFieldMeaning } from './resource';
import type { RequestFieldTarget } from './request';
import type { Presence } from './primitiveVocabulary';
import type { PropertyName } from './names';
import type { SourceSpan } from './provenance';
import type { TypeExpression } from './typeVocabulary';
import type { ModelReference, PropertyReference, ResourceReference } from './semanticReferences';
import type { ResponseJsonPayload, ResponseJsonShape, ResponseResult } from './response';
import type { ValidationRules } from './collections';

export type { ResourceFieldMeaning, RequestFieldTarget };

export type ResponsePayloadContract = ResponseJsonPayload;
export type ResponseSemanticShape = ResponseJsonShape;
export type ResponseSemanticContract = ResponseResult;
