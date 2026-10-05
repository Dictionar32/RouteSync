/** Declarative route CRUD classification through semantic relations. */
import { CrudRole, HttpMethod, matchHttpMethod } from "../../../types/route";
import { relationEqual, relationGate, relationAll, relationAny } from "../../../semantic/foundation/semanticRelations";
import { relationFirstOption, relationOptionFold, relationProject, relationSelect } from "../../../semantic/foundation/relationalSequence";

const HTTP_METHODS: readonly (readonly [string, HttpMethod])[] = [
  ['GET', 'GET'], ['POST', 'POST'], ['PUT', 'PUT'], ['PATCH', 'PATCH'],
  ['DELETE', 'DELETE'], ['OPTIONS', 'OPTIONS'], ['HEAD', 'HEAD'],
];

const canonicalMethod = (value: string): HttpMethod =>
  relationOptionFold(
    relationFirstOption(HTTP_METHODS, entry => relationEqual(entry[0], value.toUpperCase())),
    () => 'GET',
    entry => entry[1],
  );

const pathSegments = (path: string): readonly string[] =>
  relationSelect(path.replace(/^\//, '').split('/'), segment => Boolean(segment));

const staticSegments = (segments: readonly string[]): readonly string[] =>
  relationSelect(segments, segment => relationAll([!segment.startsWith('{'), !segment.startsWith(':'), !relationEqual(segment, 'api'), !/^v\d+$/i.test(segment)]));

const parameterSegments = (segments: readonly string[]): readonly string[] =>
  relationSelect(segments, segment => relationAny([segment.startsWith('{'), segment.startsWith(':')]));

const roleForMethod = (method: HttpMethod, hasTrailingParam: boolean, parameterCount: number): CrudRole =>
  matchHttpMethod(method, {
    GET: () => relationGate(relationAll([hasTrailingParam, relationEqual(parameterCount, 1)]), () => CrudRole.Show, () => relationGate(relationAll([!hasTrailingParam, relationEqual(parameterCount, 0)]), () => CrudRole.Index, () => CrudRole.Custom)),
    POST: () => relationGate(relationAll([!hasTrailingParam, relationEqual(parameterCount, 0)]), () => CrudRole.Create, () => CrudRole.Custom),
    PUT: () => relationGate(relationAll([hasTrailingParam, relationEqual(parameterCount, 1)]), () => CrudRole.Update, () => CrudRole.Custom),
    PATCH: () => relationGate(relationAll([hasTrailingParam, relationEqual(parameterCount, 1)]), () => CrudRole.Update, () => CrudRole.Custom),
    DELETE: () => relationGate(relationAll([hasTrailingParam, relationEqual(parameterCount, 1)]), () => CrudRole.Delete, () => CrudRole.Custom),
    OPTIONS: () => CrudRole.Custom,
    HEAD: () => CrudRole.Custom,
  });

export class RouteCrudClassifier {
  public static classify(method: HttpMethod, path: string): CrudRole {
    const segments = pathSegments(path);
    const statics = staticSegments(segments);
    const parameters = parameterSegments(segments);
    const hasTrailingParam = relationAny([path.endsWith('}'), path.endsWith(':id'), /\{[^}]+\}$/.test(path)]);
    return relationGate(statics.length <= 1, () => roleForMethod(canonicalMethod(method), hasTrailingParam, parameters.length), () => CrudRole.Custom);
  }
}
