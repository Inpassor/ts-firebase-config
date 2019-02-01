export interface DataObject {
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
    delimiter?: string;
}

export interface CacheOptions {
    stdTTL?: number;
    checkperiod?: number;
    errorOnMissing?: boolean;
    useClones?: boolean;
    deleteOnExpire?: boolean;
}
