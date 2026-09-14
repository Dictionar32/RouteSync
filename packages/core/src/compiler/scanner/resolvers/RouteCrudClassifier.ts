/**
 * RouteCrudClassifier.ts
 *
 * First-Class Domain Model: Determines CrudRole from HTTP method and path shape.
 * O(1) pattern-based classification eliminating downstream ternary chaining.
 *
 * @module core/compiler/scanner/resolvers/RouteCrudClassifier
 */

import { CrudRole, HttpMethod, matchHttpMethod } from "../../../types/route";

export class RouteCrudClassifier {
    /**
     * Classifies a route into a canonical CrudRole based on method and path pattern.
     */
    public static classify(method: HttpMethod, path: string): CrudRole {
        const upperMethod = method.toUpperCase() as HttpMethod;
        const segments = path.replace(/^\//, "").split("/").filter(Boolean);
        const staticSegments = segments.filter(s => !s.startsWith("{") && !s.startsWith(":") && s !== "api" && !/^v\d+$/i.test(s));
        const hasTrailingParam = path.endsWith("}") || path.endsWith(":id") || /\{[^}]+\}$/.test(path);
        const paramCount = segments.filter(s => s.startsWith("{") || s.startsWith(":")).length;
        const isSimpleResourcePath = staticSegments.length <= 1;

        if (!isSimpleResourcePath) {
            return CrudRole.Custom;
        }

        return matchHttpMethod(upperMethod, {
            GET: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Show : (!hasTrailingParam && paramCount === 0) ? CrudRole.Index : CrudRole.Custom,
            POST: () => (!hasTrailingParam && paramCount === 0) ? CrudRole.Create : CrudRole.Custom,
            PUT: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Update : CrudRole.Custom,
            PATCH: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Update : CrudRole.Custom,
            DELETE: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Delete : CrudRole.Custom,
            OPTIONS: () => CrudRole.Custom,
            HEAD: () => CrudRole.Custom,
        });
    }
}
