import type { RouteManifest } from '../base';
import type { BaseURL, GeneratedAt, ManifestVersion } from '../semanticValues';

type Assert<T extends true> = T;
type IsAssignable<A, B> = A extends B ? true : false;

type VersionContract = Assert<IsAssignable<RouteManifest['version'], ManifestVersion>>;
type BaseUrlContract = Assert<IsAssignable<RouteManifest['baseURL'], BaseURL>>;
type GeneratedAtContract = Assert<IsAssignable<RouteManifest['generatedAt'], GeneratedAt>>;

void (0 as unknown as VersionContract);
void (0 as unknown as BaseUrlContract);
void (0 as unknown as GeneratedAtContract);
