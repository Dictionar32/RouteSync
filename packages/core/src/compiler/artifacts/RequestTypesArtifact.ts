import type { ArtifactMetadata } from './Artifact';
import type {
    RequestField,
    FileValidationConstraints,
    FormAction,
    ResponseData,
    RequestResponse,
    RequestType
} from '../../types/domain/request';

export { FormActionName } from '../../types/domain/request';
export type {
    RequestField,
    FileValidationConstraints,
    FormAction,
    ResponseData,
    RequestResponse,
    RequestType
} from '../../types/domain/request';

export interface RequestTypesArtifact {
    readonly typeId: 'RequestTypes';
    readonly metadata: ArtifactMetadata;
    readonly requestTypes: readonly RequestType[];
}

export function isRequestTypesArtifact(
    artifact: unknown
): artifact is RequestTypesArtifact {
    if (typeof artifact !== 'object' || artifact === null) return false;
    const candidate = artifact as Partial<RequestTypesArtifact>;
    return candidate.typeId === 'RequestTypes'
        && Array.isArray(candidate.requestTypes)
        && typeof candidate.metadata === 'object'
        && candidate.metadata !== null;
}
