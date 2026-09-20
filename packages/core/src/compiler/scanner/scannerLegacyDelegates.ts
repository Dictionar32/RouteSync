/**
 * scannerLegacyDelegates.ts
 *
 * Backward-compatibility delegator methods for StaticLaravelScanner.
 * Preserves legacy test surfaces without polluting main orchestrator.
 *
 * @module core/compiler/scanner/scannerLegacyDelegates
 */

import type {
    BroadcastChannelDescriptor,
    ParsedRoute,
    ParsedResource,
    ParsedModel,
    ParsedColumn,
    RouteParameter
} from "../../types/route";
import type { FormRequestSource } from "../../types/domain/request";
import {
    ChannelScanner,
    ControllerScanner,
    ResourceScanner,
    FormRequestScanner,
    ModelScanner,
    RouteScanner,
    collectPhpFiles
} from "./subscanners";
import type { ModelSymbolTable } from "./symbols/ModelSymbolTable";
import type { TypeInterner } from "../types/TypeInterner";

export class ScannerLegacyDelegates {
    protected constructor(
        public readonly projectRoot: string,
        protected readonly interner: TypeInterner
    ) {}

    protected async scanChannels(): Promise<readonly BroadcastChannelDescriptor[]> {
        return ChannelScanner.scan(this.projectRoot);
    }

    protected async scanRoutes(formRequests: readonly FormRequestSource[] = []): Promise<readonly ParsedRoute[]> {
        return RouteScanner.scan(this.projectRoot, formRequests);
    }

    protected async scanControllers() {
        return ControllerScanner.scan(this.projectRoot);
    }

    protected extractPathParams(routePath: string): readonly RouteParameter[] {
        return RouteScanner.extractPathParams(routePath);
    }

    protected async collectPhpFiles(dir: string): Promise<string[]> {
        return collectPhpFiles(dir);
    }

    protected async scanResources(modelSymbolTable?: ModelSymbolTable): Promise<readonly ParsedResource[]> {
        return ResourceScanner.scan(this.projectRoot, modelSymbolTable);
    }

    protected async scanFormRequests(): Promise<readonly FormRequestSource[]> {
        return FormRequestScanner.scan(this.projectRoot, this.interner);
    }

    protected async scanModels(): Promise<readonly ParsedModel[]> {
        return ModelScanner.scan(this.projectRoot);
    }

    protected async scanMigrations(): Promise<Map<string, ParsedColumn[]>> {
        return ModelScanner.scanMigrations(this.projectRoot);
    }

    protected parseModelFile(source: string, modelName: string, migrationMap?: Map<string, ParsedColumn[]>): ParsedModel {
        return ModelScanner.parseModelFile(source, modelName, migrationMap);
    }
}
