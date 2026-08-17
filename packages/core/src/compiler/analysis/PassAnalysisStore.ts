/**
 * Typed analysis storage.
 *
 * Storage is keyed by the registry property name itself. That means the value
 * returned from storage is R[K] without passing through unknown at the API.
 */
import type { AnalysisKey } from '../passes/PassResult';
import type { AnalysisKeyName, AnalysisRegistry } from './AnalysisRegistry';

export class PassAnalysisStore<R extends object = AnalysisRegistry> {
    private values: Partial<R> = {};

    public get<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
    ): R[K] | undefined {
        return this.values[key.name];
    }

    public set<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
        value: R[K],
    ): void {
        this.values[key.name] = value;
    }

    public has<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
    ): boolean {
        return this.values[key.name] !== undefined;
    }

    public delete<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
    ): boolean {
        const existed = this.values[key.name] !== undefined;
        delete this.values[key.name];
        return existed;
    }

    public clear(): void {
        this.values = {};
    }

    public get size(): number {
        return Object.keys(this.values).length;
    }
}