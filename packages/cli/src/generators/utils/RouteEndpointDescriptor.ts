/**
 * RouteEndpointDescriptor.ts
 *
 * First-Class Domain Entity representing an API route endpoint and its canonical contract identities.
 * Pure Complete Domain Entity (0 string parsing, 0 heuristics, 0 'split' operations).
 *
 * @module cli/generators/utils
 */

import type { RouteParameter, HttpMethod } from '../../../../core/src/types/route';

export interface RouteEndpointParams {
    readonly path: string;
    readonly method: HttpMethod;
    readonly resourceName: string;
    readonly responseTypeName: string;
    readonly parameters: readonly RouteParameter[];
}

export class RouteEndpointDescriptor {
    public readonly path: string;
    public readonly method: HttpMethod;
    public readonly resourceName: string;
    public readonly responseTypeName: string;
    public readonly parameters: readonly RouteParameter[];

    constructor({
        path,
        method,
        resourceName,
        responseTypeName,
        parameters
    }: RouteEndpointParams) {
        this.path = path;
        this.method = method;
        this.resourceName = resourceName;
        this.responseTypeName = responseTypeName;
        this.parameters = Object.freeze(parameters);
        Object.freeze(this);
    }
}