import fetch from 'node-fetch';
import * as NodeCache from 'node-cache';
import {google} from 'googleapis';
import {Compute} from 'google-auth-library';
import {JWTOptions} from 'google-auth-library/build/src/auth/jwtclient';

import {
    Data,
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

    private _cache: NodeCache = null;
    private _etag: string = null;

    constructor(options: FirebaseConfigOptions) {
        Object.assign(this, options);
        this.path = `/v1/projects/${this.projectId}/remoteConfig`;
        this._cache = new NodeCache(this.cacheOptions || {});
    }

    public getETag(): string {
        if (!this._etag) {
            this._etag = this._cache.get('--firebaseremoteconfig--etag--') || '*';
        }
        return this._etag;
    }

    public setETag(etag: string): void {
        if (etag && etag !== this._etag) {
            this._etag = etag;
            this._cache.set('--firebaseremoteconfig--etag--', this._etag);
        }
    }

    public getAccessToken(): Promise<string> {
        return new Promise((resolve, reject) => {
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
            if (this.keyFileName || (this.key && this.keyId)) {
                const jwtClient = new google.auth.JWT(clientOptions);
                jwtClient.authorize((error: any, tokens) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(tokens.access_token);
                    }
                });
            } else {
                new Compute().getAccessToken((error: any, token?: string | null) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(token);
                    }
                });
            }
        });
    }

    public get(): Promise<Data> {
        return new Promise((resolve, reject) => {
            this.getAccessToken().then((accessToken: string) => {
                fetch(`https://${this.host}${this.path}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept-Encoding': 'gzip',
                    },
                })
                    .then((response: any): Data => {
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
                    .then((data: Data) => {
                        if (data && data.parameters) {
                            const parameters: Data = {};
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
                            resolve(parameters);
                        } else {
                            reject(this.defaultErrorMessage);
                        }
                    })
                    .catch((error: any) => reject(error));
            }, (error: any) => reject(error));
        });
    }

    public set(parameters: Data): Promise<null> {
        return new Promise((resolve, reject) => {
            this.getAccessToken().then((accessToken: string) => {
                const body: Data = {
                    parameters: {},
                };
                for (const key in parameters) {
                    if (parameters.hasOwnProperty(key)) {
                        body.parameters[key] = {
                            defaultValue: {
                                value: parameters[key],
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
