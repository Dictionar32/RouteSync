import { RouteManifest, SemanticResolutionKernel } from '@routesync/core'
import { NormalizedManifest, NormalizedRoute, NormalizedModel, NormalizedResource } from './normalizer'

export interface SourceLocation {
  readonly file: string
  readonly line: number
  readonly column?: number
}

export interface Diagnostic {
  readonly severity: "error" | "warning" | "info"
  readonly message: string
  readonly loc?: SourceLocation
}

export interface CompilerConfig {
  readonly debugMode: boolean
  readonly manifestPath?: string
  readonly outputPath?: string
}

export class CompilerContext {
  readonly config: CompilerConfig
  readonly diagnostics: Diagnostic[] = []
  readonly cache = new Map<string, any>()

  constructor(config: CompilerConfig = { debugMode: false }) {
    this.config = config
  }

  reportDiagnostic(diag: Diagnostic): void {
    this.diagnostics.push(diag)
    if (this.config.debugMode) {
      console.warn(`[Compiler Diagnostic - ${diag.severity.toUpperCase()}] ${diag.message}`)
    }
  }

  hasErrors(): boolean {
    return this.diagnostics.some(d => d.severity === 'error')
  }
}

export interface CompilerPass<I, O> {
  readonly id: string
  readonly name: string
  readonly inputKind: string
  readonly outputKind: string
  run(input: I, context: CompilerContext): O
}

export class CompilerPipeline {
  private passes: CompilerPass<any, any>[] = []

  addPass<I, O>(pass: CompilerPass<I, O>): this {
    if (this.passes.length > 0) {
      const lastPass = this.passes[this.passes.length - 1]
      if (lastPass.outputKind !== pass.inputKind) {
        throw new Error(`Pipeline type mismatch: Pass "${pass.name}" expects input kind "${pass.inputKind}" but previous pass "${lastPass.name}" outputs "${lastPass.outputKind}".`)
      }
    }
    this.passes.push(pass)
    return this;
  }

  compile(initialInput: any, context: CompilerContext): any {
    let currentInput = initialInput
    for (const pass of this.passes) {
      if (context.config.debugMode) {
        console.log(`[Pipeline] Running pass: ${pass.name} (${pass.id})`)
      }
      currentInput = pass.run(currentInput, context)
    }
    return currentInput
  }
}
