/**
 * bridgeTypes.ts
 *
 * Type contracts for CompilerBridge pure dataflow pipeline.
 *
 * @module generators/bridge/bridgeTypes
 */

import type { RouteManifest } from '../../../../core/src/types/route'
import type { ClassifiedDomainGraph } from '../../../../core/src/types/domain/domainGraph'
import type { ClassifiedRoute } from '../route-classifier'
import {
    type CompilerOutput,
    type FormOutput,
    type ContractOutput,
    type ApiFieldOutput,
    type MapperOutput
} from '../../../../core/src/compiler/passes/outputLowerers'

export type { CompilerOutput, FormOutput, ContractOutput, ApiFieldOutput, MapperOutput }

export interface CompiledContractsBundle {
    readonly readTypes: CompilerOutput
    readonly formTypes: FormOutput
    readonly contracts: ContractOutput
    readonly apiFields: ApiFieldOutput
    readonly mappers: MapperOutput
}

export interface EmittedCompilerArtifacts extends CompiledContractsBundle {
    readonly writtenPaths: readonly string[]
}

export interface FullBundleEmittedArtifacts extends CompiledContractsBundle {
    readonly writtenPaths: readonly string[]
    readonly clientArtifacts: readonly (readonly string[])[]
}

export interface CompilerBundleOptions {
    readonly zod?: boolean
    readonly hooks?: boolean
    readonly nextActions?: boolean
    readonly msw?: boolean
    readonly echo?: boolean
    readonly models?: boolean
    readonly routesGenerated?: boolean
    readonly [key: string]: unknown
}

export interface CompilerEmitContext {
    readonly manifest: RouteManifest
    readonly outputDir: string
    readonly domainGraph: ClassifiedDomainGraph<ClassifiedRoute>
    readonly contractsBundle: CompiledContractsBundle
    readonly options: CompilerBundleOptions
}

export interface CompilerEmitter {
    readonly name: string
    emit(context: CompilerEmitContext): Promise<readonly string[]>
}
