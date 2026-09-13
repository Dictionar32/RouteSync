import type { TSEmitModule, GeneratedSDKModule } from '@routesync/core';
import { convertGeneratedModule, type TSExportDefinition } from './zod-converter';

export type { TSExportDefinition };

export class ZodToTSEmitIR {
  public static convertModules(modules: GeneratedSDKModule[]): TSEmitModule[] {
    return modules.map(m => this.convertModule(m));
  }

  public static convertModule(module: GeneratedSDKModule): TSEmitModule {
    return convertGeneratedModule(module);
  }
}
