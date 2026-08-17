/**
 * Phase 4C — Response IR builder.
 *
 * Converts already-analyzed response facts into one structured ResponseIR.
 * It does not infer arbitrary PHP semantics and it does not own TypeIR
 * construction.
 */

import {
    createEmptyResponse,
    createModelResponse,
    createObjectResponse,
    createPrimitiveResponse,
    createResourceResponse,
    httpTransport,
    type CollectionShape,
    type ResponseIR,
    type ResponsePayloadIR,
} from './ResponseIR';
import type { TypeIR } from '../types/TypeIR';

export type ResponseAnalysisInput =
    | {
        readonly kind: 'resource';
        readonly resource: string;
        readonly model?: string;
        readonly shape: CollectionShape;
        readonly type?: TypeIR;
    }
    | {
        readonly kind: 'model';
        readonly model: string;
        readonly shape: CollectionShape;
        readonly type?: TypeIR;
    }
    | {
        readonly kind: 'object';
        readonly shape: CollectionShape;
        readonly schema: TypeIR;
        readonly schemaName?: string;
    }
    | {
        readonly kind: 'primitive';
        readonly primitiveType: 'string' | 'number' | 'boolean' | 'null';
    }
    | {
        readonly kind: 'binary';
        readonly contentType?: string;
        readonly filename?: string;
    }
    | {
        readonly kind: 'empty';
    }
    | {
        readonly kind: 'redirect';
        readonly target?: string;
    };

export interface ResponseIRInput {
    readonly id: string;
    readonly analysis: ResponseAnalysisInput;
    readonly status?: number;
    readonly contentType?: string;
}

export class StructuredResponseIRBuilder {
    public build(input: ResponseIRInput): ResponseIR {
        return {
            kind: 'response',
            id: input.id,
            transport: httpTransport(
                input.status,
                input.contentType,
            ),
            payload: this.buildPayload(input.analysis),
        };
    }

    private buildPayload(
        analysis: ResponseAnalysisInput,
    ): ResponsePayloadIR {
        switch (analysis.kind) {
            case 'resource':
                return createResourceResponse(
                    analysis.resource,
                    analysis.shape,
                    {
                        model: analysis.model,
                        type: analysis.type,
                    },
                );

            case 'model':
                return createModelResponse(
                    analysis.model,
                    analysis.shape,
                    analysis.type,
                );

            case 'object':
                return createObjectResponse(
                    analysis.schema,
                    analysis.shape,
                    analysis.schemaName,
                );

            case 'primitive':
                return createPrimitiveResponse(
                    analysis.primitiveType,
                );

            case 'binary':
                return {
                    kind: 'binary',
                    contentType: analysis.contentType,
                    filename: analysis.filename,
                };

            case 'empty':
                return createEmptyResponse();

            case 'redirect':
                return {
                    kind: 'redirect',
                    target: analysis.target,
                };
        }
    }
}
