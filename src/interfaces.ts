export interface Data {
    [key: string]: any;
}

export interface CacheOptions {
    stdTTL?: number;
    checkperiod?: number;
    errorOnMissing?: boolean;
    useClones?: boolean;
    deleteOnExpire?: boolean;
}
