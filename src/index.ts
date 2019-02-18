import {
    flatten,
    unflatten,
} from 'flat';
import * as NodeCache from 'node-cache';
import {
    auth,
    Compute,
    JWT,
    UserRefreshClient,
    JWTOptions,
} from 'google-auth-library';

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

export class FirebaseConfig {

    public projectId: string = null;
    public keyFileName: string = null;
    public key: string = null;
    public keyId: string = null;
    public cacheOptions: NodeCache.Options = {};
    public delimiter: string = '___';
    public defaultErrorMessage = 'Invalid response from the Firebase Remote Config service';

    private client: Compute | JWT | UserRefreshClient = null;
    private cache: NodeCache = null;
    private etag: string = null;

    constructor(options?: FirebaseConfigOptions) {
        Object.assign(this, options);
        this.cache = new NodeCache(this.cacheOptions);
    }

    private async getProjectId(): Promise<string> {
        if (!this.projectId) {
            this.projectId = await auth.getProjectId();
        }
        return this.projectId;
    }

    private async getClient(): Promise<Compute | JWT | UserRefreshClient> {
        if (!this.client) {
            const scopes = 'https://www.googleapis.com/auth/firebase.remoteconfig';
            if (this.keyFileName || (this.key && this.keyId)) {
                const clientOptions: JWTOptions = {
                    scopes,
                };
                if (this.keyFileName) {
                    clientOptions.keyFile = this.keyFileName;
                }
                if (this.key && this.keyId) {
                    clientOptions.key = this.key;
                    clientOptions.keyId = this.keyId;
                }
                this.client = new JWT(clientOptions);
            } else {
                this.client = await auth.getClient({
                    scopes,
                });
            }
        }
        return this.client;
    }

    private async getRequestHeaders(): Promise<DataObject> {
        const client = await this.getClient();
        const headers = await client.getRequestHeaders();
        headers['Accept-Encoding'] = 'gzip';
        return headers;
    }

    private async getUrl(): Promise<string> {
        const projectId = await this.getProjectId();
        return `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig`;
    }

    private encodeParameters(parameters: DataObject): string {
        const body: DataObject = {
            parameters: {},
        };
        const flattenParameters = flatten(parameters, {
            delimiter: this.delimiter,
        });
        for (const key in flattenParameters) {
            if (flattenParameters.hasOwnProperty(key)) {
                const value = JSON.stringify(flattenParameters[key]);
                body.parameters[key] = {
                    defaultValue: {
                        value,
                    },
                };
            }
        }
        return JSON.stringify(body);
    }

    private decodeParameters(data: any): DataObject {
        if (data && data.parameters) {
            const parameters: DataObject = {};
            for (const key in data.parameters) {
                if (data.parameters.hasOwnProperty(key)) {
                    const value = data.parameters[key]
                        && data.parameters[key].defaultValue
                        && data.parameters[key].defaultValue.value;
                    if (value) {
                        parameters[key] = JSON.parse(value);
                    }
                }
            }
            return unflatten(parameters, {
                delimiter: this.delimiter,
            });
        } else {
            return null;
        }
    }

    private getETag(): string {
        if (!this.etag) {
            this.etag = this.cache.get('--firebaseremoteconfig--etag--') || '*';
        }
        return this.etag;
    }

    private setETag(etag: string): void {
        if (etag && etag !== this.etag) {
            this.etag = etag;
            this.cache.set('--firebaseremoteconfig--etag--', this.etag);
        }
    }

    public async set(parameters: DataObject): Promise<void> {
        const [client, headers, url] = await Promise.all([
            this.getClient(),
            this.getRequestHeaders(),
            this.getUrl(),
        ]);
        headers['Content-Type'] = 'application/json; UTF-8';
        headers['If-Match'] = this.getETag();
        const response = await client.request({
            url,
            method: 'PUT',
            headers,
            body: this.encodeParameters(parameters),
        });
        if (response && response.status === 200) {
            this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
            return;
        }
        throw new Error(response.statusText || this.defaultErrorMessage);
    }

    public async get(): Promise<DataObject> {
        const [client, headers, url] = await Promise.all([
            this.getClient(),
            this.getRequestHeaders(),
            this.getUrl(),
        ]);
        const response = await client.request({
            url,
            headers,
        });
        if (response && response.status === 200) {
            this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
            return this.decodeParameters(response.data);
        }
        throw new Error(response.statusText || this.defaultErrorMessage);
    }

}
