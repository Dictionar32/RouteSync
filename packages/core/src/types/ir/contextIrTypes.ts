/**
 * contextIrTypes.ts
 *
 * Generation context, emitter definitions, and contract root structure.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/contextIrTypes
 */

import type { ResourceIR } from './resourceIrTypes';
import type { RequestIR } from './requestIrTypes';
import type { EndpointIR } from './endpointIrTypes';
import type { SharedTypeIR, EnumIR, ImportIR } from './sharedIrTypes';
import type { RouteManifest } from './manifestIrTypes';

export interface ContractMetadata {
    readonly version: string;
    readonly generated_at: string;
    readonly generator_version: string;
    readonly source_files: readonly string[];
    readonly total_resources: number;
    readonly total_requests: number;
    readonly total_endpoints: number;
}

export interface ContractIR {
    readonly resources: readonly ResourceIR[];
    readonly requests: readonly RequestIR[];
    readonly endpoints: readonly EndpointIR[];
    readonly sharedTypes: readonly SharedTypeIR[];
    readonly enums: readonly EnumIR[];
    readonly imports: readonly ImportIR[];
    readonly metadata: ContractMetadata;
}

export interface GenerationConfig {
    readonly typescript: {
        readonly strict: boolean;
        readonly target: string;
        readonly moduleResolution: string;
    };
    readonly validation: {
        readonly useZod: boolean;
        readonly useLaravel: boolean;
    };
    readonly naming: {
        readonly caseTransform: 'camel' | 'snake' | 'pascal';
        readonly resourceSuffix: string;
        readonly requestSuffix: string;
    };
}

export interface GenerationContext {
    readonly projectRoot: string;
    readonly outputDir: string;
    readonly config: GenerationConfig;
    readonly manifest: RouteManifest;
}

export interface FileMetadata {
    readonly lines: number;
    readonly imports: readonly string[];
    readonly exports: readonly string[];
}

export interface GeneratedFile {
    readonly path: string;
    readonly content: string;
    readonly metadata: FileMetadata;
}

export interface OutputMetadata {
    readonly duration_ms: number;
    readonly memory_usage_mb: number;
    readonly files_written: number;
    readonly warnings: readonly string[];
    readonly errors: readonly string[];
}

export interface GeneratedOutput {
    readonly files: readonly GeneratedFile[];
    readonly metadata: OutputMetadata;
}

export interface IREmitter {
    emit(ir: ContractIR, context: GenerationContext): Promise<GeneratedOutput>;
}
