/**
 * engineConfig.ts
 *
 * Configuration interfaces and default file naming strategy for CodeGenerationEngine.
 *
 * @module compiler/pipeline/engine/engineConfig
 */

import type { PipelineConfig } from '../ICodeGenerationPipeline';

/**
 * File naming strategy
 */
export interface FileNamingStrategy {
    /** Generate filename untuk artifact type */
    getFileName(artifactType: string): string;
}

/**
 * Configuration untuk CodeGenerationEngine
 */
export interface EngineConfig extends PipelineConfig {
    /** Enable detailed logging */
    readonly verbose?: boolean;

    /** Output directory untuk file writing */
    readonly outputDir?: string;

    /** Custom file naming strategy */
    readonly fileNaming?: FileNamingStrategy;
}

/**
 * Default file naming strategy
 */
export const DEFAULT_FILE_NAMING: FileNamingStrategy = {
    getFileName(artifactType: string): string {
        switch (artifactType) {
            case 'GeneratedTypeScript':
                return 'types/api-read.ts';
            case 'GeneratedForm':
                return 'forms/api-form.ts';
            case 'GeneratedContract':
                return 'contracts/api-contract.ts';
            default:
                return `generated/${artifactType.toLowerCase()}.ts`;
        }
    }
};

export function createDefaultEngineConfig(custom?: EngineConfig): EngineConfig {
    return {
        stages: {
            formatting: true,
            validation: true,
            optimization: true
        },
        profiling: false,
        failFast: true,
        verbose: false,
        fileNaming: DEFAULT_FILE_NAMING,
        ...custom
    };
}

