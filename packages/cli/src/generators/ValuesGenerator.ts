import { RouteManifest } from '@routesync/core'

export class ValuesGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    // No-op: we now extract types dynamically from endpoint callables in defineHooks,
    // so value-space constants are no longer needed in api-read.ts or api-form.ts.
  }
}
