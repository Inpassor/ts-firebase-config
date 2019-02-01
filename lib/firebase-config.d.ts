import { DataObject, FirebaseConfigOptions, CacheOptions } from './interfaces';
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
    delimiter: string;
    private cache;
    private etag;
    constructor(options: FirebaseConfigOptions);
    private getETag;
    private setETag;
    private getAccessToken;
    get(): Promise<DataObject | null>;
    set(parameters: DataObject): Promise<null>;
}
