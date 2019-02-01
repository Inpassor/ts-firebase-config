import {
    flatten,
    unflatten,
} from 'flat';
import fetch from 'node-fetch';
import * as NodeCache from 'node-cache';
import {google} from 'googleapis';
import {
    Compute,
    Credentials,
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

    private cache: NodeCache = null;
    private etag: string = null;

    constructor(options: FirebaseConfigOptions) {
        Object.assign(this, options);
        this.path = `/v1/projects/${this.projectId}/remoteConfig`;
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

    private getAccessToken(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
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
                const jwtClient = new google.auth.JWT(clientOptions);
                jwtClient.authorize((error: any, tokens: Credentials) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(tokens.access_token);
                    }
                });
            } else {
                (new Compute()).getAccessToken((error: any, token?: string | null) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(token);
                    }
                });
            }
        });
    }

    public get(): Promise<DataObject | null> {
        return new Promise<DataObject | null>((resolve, reject) => {
            this.getAccessToken().then((accessToken: string) => {
                fetch(`https://${this.host}${this.path}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept-Encoding': 'gzip',
                    },
                })
                    .then((response: any): DataObject => {
                        if (response) {
                            if (response.status === 200) {
                                this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
                                return response.json();
                            } else {
                                reject(response.statusText || this.defaultErrorMessage);
                            }
                        } else {
                            reject(this.defaultErrorMessage);
                        }
                    })
                    .then((data: DataObject) => {
                        if (data && data.parameters) {
                            const parameters: DataObject = {};
                            for (const key in data.parameters) {
                                if (data.parameters.hasOwnProperty(key)) {
                                    const value = data.parameters[key]
                                        && data.parameters[key].defaultValue
                                        && data.parameters[key].defaultValue.value;
                                    if (value) {
                                        parameters[key] = value;
                                    }
                                }
                            }
                            resolve(unflatten(parameters));
                        } else {
                            resolve(null);
                        }
                    })
                    .catch((error: any) => reject(error));
            }, (error: any) => reject(error));
        });
    }

    public set(parameters: DataObject): Promise<null> {
        return new Promise<null>((resolve, reject) => {
            this.getAccessToken().then((accessToken: string) => {
                const body: DataObject = {
                    parameters: {},
                };
                const flattenParameters = flatten(parameters);
                for (const key in flattenParameters) {
                    if (flattenParameters.hasOwnProperty(key)) {
                        body.parameters[key] = {
                            defaultValue: {
                                value: flattenParameters[key],
                            },
                        };
                    }
                }
                fetch(`https://${this.host}${this.path}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json; UTF-8',
                        'Accept-Encoding': 'gzip',
                        'If-Match': this.getETag(),
                    },
                    body: JSON.stringify(body),
                })
                    .then((response: any) => {
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
                    })
                    .catch((error: any) => reject(error));
            }, (error: any) => reject(error));
        });
    }

}
