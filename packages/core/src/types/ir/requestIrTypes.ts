/**
 * Request domain IR.
 *
 * Request meaning is carried by the upstream ADT and fields. This IR does not
 * re-classify actions or maintain parallel validation bags.
 */

import type { RequestField } from '../upstream/request';
import type { ActionName, RequestId, RequestName, ControllerName, RouteName, SourceFilePath } from './nominalVocabulary';
import type { GenerationTimestamp } from '../upstream/valueObjects';

export interface RequestActionIR {
    readonly name: ActionName;
    readonly fields: readonly RequestField[];
}

export interface RequestMetadata {
    readonly sourceFile: SourceFilePath;
    readonly controller: ControllerName;
    readonly routes: readonly RouteName[];
    readonly generated_at: GenerationTimestamp;
}

export interface RequestIR {
    readonly id: RequestId;
    readonly name: RequestName;
    readonly actions: readonly RequestActionIR[];
    readonly metadata: RequestMetadata;
}
