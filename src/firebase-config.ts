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

import {
    DataObject,
    FirebaseConfigOptions,
    CacheOptions,
} from './interfaces';

export class FirebaseConfig {

    public host = 'firebaseremoteconfig.googleapis.com';
    public scopes: string[] = [
        'https://www.googleapis.com/auth/firebase.remoteconfig',
    ];
    public cacheOptions: CacheOptions = null;
    public projectId: string = null;
    public keyFileName: string = null;
    public key: string = null;
    public keyId: string = null;
    public path: string = null;
    public defaultErrorMessage = 'Invalid response from the Firebase Remote Config service';
    public delimiter: string = '___';

    private cache: NodeCache = null;
    private etag: string = null;

    constructor(options?: FirebaseConfigOptions) {
        Object.assign(this, options);
        this.cache = new NodeCache(this.cacheOptions || {});
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

    private async getProjectId(): Promise<string> {
        return Promise.resolve(this.projectId || await auth.getProjectId());
    }

    private async getPath(): Promise<string> {
        const projectId = await this.getProjectId();
        return Promise.resolve(this.path || `/v1/projects/${projectId}/remoteConfig`);
    }

    private async getClient(): Promise<Compute | JWT | UserRefreshClient> {
        if (this.keyFileName || (this.key && this.keyId)) {
            const clientOptions: JWTOptions = {
                scopes: this.scopes,
            };
            if (this.keyFileName) {
                clientOptions.keyFile = this.keyFileName;
            }
            if (this.key && this.keyId) {
                clientOptions.key = this.key;
                clientOptions.keyId = this.keyId;
            }
            return Promise.resolve(new JWT(clientOptions));
        }
        return await auth.getClient({
            scopes: this.scopes,
        });
    }

    private getAuthHeaders(): Promise<DataObject> {
        return new Promise<DataObject>((resolve, reject) => {
            Promise.all([
                this.getProjectId(),
                this.getClient(),
            ]).then(
                ([projectId, client]) => {
                    client.getRequestHeaders().then(
                        (headers) => {
                            headers['Accept-Encoding'] = 'gzip';
                            resolve(headers);
                        },
                        (error: any) => reject(error),
                    );
                },
                (error: any) => reject(error),
            );
        });
    }

    public get(): Promise<DataObject | null> {
        return new Promise<DataObject | null>((resolve, reject) => {
            Promise.all([
                this.getClient(),
                this.getAuthHeaders(),
                this.getPath(),
            ]).then(
                ([client, headers, path]) => {
                    client.request({
                        url: `https://${this.host}${path}`,
                        headers,
                    }).then(
                        (response: any) => {
                            if (response) {
                                if (response.status === 200) {
                                    this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
                                    const data = response.data;
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
                                        resolve(unflatten(parameters, {
                                            delimiter: this.delimiter,
                                        }));
                                    } else {
                                        resolve(null);
                                    }
                                } else {
                                    reject(response.statusText || this.defaultErrorMessage);
                                }
                            } else {
                                reject(this.defaultErrorMessage);
                            }
                        },
                        (error: any) => reject(error),
                    );
                }, (error: any) => reject(error),
            );
        });
    }

    public set(parameters: DataObject): Promise<null> {
        return new Promise<null>((resolve, reject) => {
            Promise.all([
                this.getClient(),
                this.getAuthHeaders(),
                this.getPath(),
            ]).then(
                ([client, headers, path]) => {
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
                    headers['Content-Type'] = 'application/json; UTF-8';
                    headers['If-Match'] = this.getETag();
                    client.request({
                        url: `https://${this.host}${path}`,
                        method: 'PUT',
                        headers,
                        body: JSON.stringify(body),
                    }).then(
                        (response: any) => {
                            if (response) {
                                if (response.status === 200) {
                                    this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
                                    resolve();
                                } else {
                                    reject(response.statusText || this.defaultErrorMessage);
                                }
                            } else {
                                reject(this.defaultErrorMessage);
                            }
                        },
                        (error: any) => reject(error),
                    );
                }, (error: any) => reject(error),
            );
        });
    }

}
