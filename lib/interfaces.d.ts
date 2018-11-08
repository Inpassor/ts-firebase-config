export interface Data {
    [key: string]: any;
}
export interface FirebaseConfigOptions {
    projectId: string;
    keyFileName?: string;
    key?: string;
    keyId?: string;
    host?: string;
    scopes?: string[];
    cacheOptions?: CacheOptions;
}
export interface CacheOptions {
    stdTTL?: number;
    checkperiod?: number;
    errorOnMissing?: boolean;
    useClones?: boolean;
    deleteOnExpire?: boolean;
}
