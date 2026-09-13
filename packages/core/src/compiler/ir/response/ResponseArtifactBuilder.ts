/**
 * ResponseArtifactBuilder.ts
 *
 * Fluent builder for deterministic ResponseArtifact construction.
 * Active Consumer: Orchestrates ResponseArtifact builder pipeline.
 *
 * @module compiler/ir/response
 */

import type { FileSpan } from '../../types/FileSpan';
import type { ArtifactMetadata } from '../../artifacts/Artifact';
import type { ResponseDescriptor, ConfidenceScore } from './responseDescriptors';
import type {
    ResponseBody,
    ResourceBody,
    ModelBody,
    PrimitiveBody,
    ObjectBody
} from './responseBodies';
import type { ObjectSchema } from './objectSchemas';
import { ResponseArtifact } from './ResponseArtifactClass';
import {
    type ResponseBuilderState,
    createInitialBuilderState,
    applyResourceToState,
    applyModelToState,
    applyPrimitiveToState,
    applyObjectToState,
    buildResponseArtifact,
    setTransport,
    setStatus,
    setContentType,
    setContentDisposition,
    setNullable,
    setConfidenceScore
} from './builder/index';

export {
    exampleResourceSingle,
    exampleCollectionLowConfidence,
    exampleBinaryDownload
} from './responseExamples';

/**
 * Fluent builder for ResponseArtifact instances
 */
export class ResponseArtifactBuilder {
    private readonly state: ResponseBuilderState = createInitialBuilderState();

    id(value: string): this {
        this.state.id = value;
        return this;
    }

    transport(type: ResponseDescriptor['transport']): this {
        setTransport(this.state, type);
        return this;
    }

    status(code: number): this {
        setStatus(this.state, code);
        return this;
    }

    contentType(type: string): this {
        setContentType(this.state, type);
        return this;
    }

    contentDisposition(type: 'inline' | 'attachment', filename?: string): this {
        setContentDisposition(this.state, type, filename);
        return this;
    }

    nullable(value = true): this {
        setNullable(this.state, value);
        return this;
    }

    confidence(score: ConfidenceScore): this {
        this.state.confidence = score;
        return this;
    }

    confidenceScore(score: number, reason: string, method: ConfidenceScore['method'] = 'inferred'): this {
        setConfidenceScore(this.state, score, reason, method);
        return this;
    }

    body(body: ResponseBody): this {
        this.state.body = body;
        return this;
    }

    resource(
        resourceName: string,
        modelName: string | undefined,
        shape: ResourceBody['shape'] = 'single',
        confidenceScore = 1.0,
        confidenceReason = 'Explicit resource return'
    ): this {
        applyResourceToState(this.state, resourceName, modelName, shape, confidenceScore, confidenceReason);
        return this;
    }

    model(
        modelName: string,
        shape: ModelBody['shape'] = 'single',
        confidenceScore = 0.9,
        confidenceReason = 'Inferred from model return'
    ): this {
        applyModelToState(this.state, modelName, shape, confidenceScore, confidenceReason);
        return this;
    }

    primitive(
        primitiveType: PrimitiveBody['primitiveType'],
        confidenceScore = 1.0,
        confidenceReason = 'Explicit primitive return'
    ): this {
        applyPrimitiveToState(this.state, primitiveType, confidenceScore, confidenceReason);
        return this;
    }

    object(
        schemaName: string | undefined,
        schema: ObjectSchema,
        shape: ObjectBody['shape'] = 'single',
        confidenceScore = 0.8,
        confidenceReason = 'Heuristic object inference'
    ): this {
        applyObjectToState(this.state, schemaName, schema, shape, confidenceScore, confidenceReason);
        return this;
    }

    span(location: FileSpan): this {
        this.state.span = location;
        return this;
    }

    metadata(meta: Partial<ArtifactMetadata>): this {
        this.state.metadataPartial = { ...this.state.metadataPartial, ...meta };
        return this;
    }

    build(): ResponseArtifact {
        return buildResponseArtifact(
            this.state.id,
            this.state.descriptor,
            this.state.body,
            this.state.confidence,
            this.state.span,
            this.state.metadataPartial
        );
    }
}
