import path from 'path';
import fs from 'fs-extra';
import { RouteManifest, GeneratedSDKModule } from '@routesync/core';
import { SdkGenerator, ZodToTSEmitIR, TSPrinter } from '@routesync/sdk';

export class CompilerBackendGenerator {
  public static async generate(manifest: RouteManifest, outputDir: string) {
    // 1. Generate SDK Contracts (Zod AST + React Query Hooks)
    const sdkModules: GeneratedSDKModule[] = SdkGenerator.generate(manifest);

    // 2. Convert to TS Emit IR
    const emitModules = ZodToTSEmitIR.convertModules(sdkModules);

    // 3. Print to single api-service.ts file
    await fs.ensureDir(outputDir);

    const mergedImports = new Map<string, any>();
    const allSchemas: any[] = [];
    const allInterfaces: any[] = [];
    const allFunctions: any[] = [];
    const allExports: any[] = [];

    for (const emitIR of emitModules) {
        for (const fileUnit of emitIR.files) {
            for (const imp of fileUnit.imports) {
                if (!mergedImports.has(imp.from)) {
                    mergedImports.set(imp.from, { ...imp, named: imp.named ? [...imp.named] : [] });
                } else {
                    const existing = mergedImports.get(imp.from)!;
                    if (imp.default && !existing.default) existing.default = imp.default;
                    if (imp.named) {
                        existing.named = existing.named || [];
                        for (const n of imp.named) {
                            if (!existing.named.includes(n)) existing.named.push(n);
                        }
                    }
                }
            }
            allSchemas.push(...fileUnit.zodSchemas);
            allInterfaces.push(...fileUnit.interfaces);
            allFunctions.push(...fileUnit.functions);
            if (fileUnit.exports) {
                allExports.push(...fileUnit.exports);
            }
        }
    }

    const singleFileUnit = {
        filePath: 'routes/api-service.ts',
        imports: Array.from(mergedImports.values()),
        zodSchemas: allSchemas,
        interfaces: allInterfaces,
        functions: allFunctions,
        exports: allExports
    };

    const outPath = path.join(outputDir, singleFileUnit.filePath);
    await fs.ensureDir(path.dirname(outPath));
    const code = TSPrinter.print(singleFileUnit);
    await fs.writeFile(outPath, code, 'utf-8');

    // Write index.ts for simple barrel export
    await fs.writeFile(path.join(outputDir, 'index.ts'), "export * from './routes/api-service';\n", 'utf-8');
  }
}
