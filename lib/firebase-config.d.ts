import { Data, FirebaseConfigOptions, CacheOptions } from './interfaces';
export declare class FirebaseConfig {
    host: string;
    scopes: string[];
    cacheOptions: CacheOptions;
    projectId: string;
    keyFileName: string;
    key: string;
    keyId: string;
    path: string;
    defaultErrorMessage: string;
    private _cache;
    private _etag;
    constructor(options: FirebaseConfigOptions);
    getETag(): string;
    setETag(etag: string): void;
    getAccessToken(): Promise<string>;
    get(): Promise<Data>;
    set(parameters: Data): Promise<null>;
}
