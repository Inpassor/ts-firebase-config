import * as NodeCache from 'node-cache';
export interface DataObject {
    [key: string]: any;
}
export interface FirebaseConfigOptions {
    projectId?: string;
    keyFileName?: string;
    key?: string;
    keyId?: string;
    cacheOptions?: NodeCache.Options;
    delimiter?: string;
    defaultErrorMessage?: string;
}
export declare class FirebaseConfig {
    projectId: string;
    keyFileName: string;
    key: string;
    keyId: string;
    cacheOptions: NodeCache.Options;
    delimiter: string;
    defaultErrorMessage: string;
    private client;
    private cache;
    private etag;
    constructor(options?: FirebaseConfigOptions);
    private getProjectId;
    private getClient;
    private getRequestHeaders;
    private getUrl;
    private encodeParameters;
    private decodeParameters;
    private getETag;
    private setETag;
    set(parameters: DataObject): Promise<void>;
    get(): Promise<DataObject>;
}
