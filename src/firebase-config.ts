import * as fs from 'fs';
import fetch from 'node-fetch';
import {google} from 'googleapis';
import * as NodeCache from 'node-cache';

import {
    Data,
    CacheOptions,
} from './interfaces';

export interface FirebaseConfigOptions {
    projectId: string;
    keyFileName: string;
    host?: string;
    scopes?: string[];
    cacheOptions?: CacheOptions;
}

export class FirebaseConfig {

    public host = 'firebaseremoteconfig.googleapis.com';
    public scopes: string[] = [
        'https://www.googleapis.com/auth/firebase.remoteconfig',
    ];
    public cacheOptions: CacheOptions = null;
    public projectId: string = null;
    public keyFileName: string = null;
    public path: string = null;

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
            const key = JSON.parse(fs.readFileSync(this.keyFileName, 'utf8'));
            const jwtClient = new google.auth.JWT(
                key.client_email,
                null,
                key.private_key,
                this.scopes,
                null
            );
            jwtClient.authorize((error: any, tokens) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(tokens.access_token);
                }
            });
        });
    }

    public get(version?: number): Promise<Data> {
        return new Promise((resolve, reject) => {
            this.getAccessToken().then((accessToken: string) => {
                const errorMessage = 'Invalid response from the Firebase Remote Config service';
                fetch(`https://${this.host}${this.path}${version ? `?version_number=${version}` : ''}`, {
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
                                reject(response.statusText || errorMessage);
                            }
                        } else {
                            reject(errorMessage);
                        }
                    })
                    .then((data: Data) => {
                        if (data && data.parameters) {
                            const config: Data = {};
                            for (const key in data.parameters) {
                                if (data.parameters.hasOwnProperty(key)) {
                                    config[key] = data.parameters[key]
                                        && data.parameters[key].defaultValue
                                        && data.parameters[key].defaultValue.value;
                                }
                            }
                            resolve(config);
                        } else {
                            reject(errorMessage);
                        }
                    })
                    .catch((error: any) => reject(error));
            }, (error: any) => reject(error));
        });
    }

    public set(config: Data): Promise<null> {
        return new Promise((resolve, reject) => {
            this.getAccessToken().then((accessToken: string) => {
                const body: Data = {
                    parameters: {},
                };
                for (const key in config) {
                    if (config.hasOwnProperty(key)) {
                        body.parameters[key] = {
                            defaultValue: {
                                value: config[key],
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
                        const errorMessage = 'Invalid response from the Firebase Remote Config service';
                        if (response) {
                            if (response.status === 200) {
                                this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
                                resolve();
                            } else {
                                reject(response.statusText || errorMessage);
                            }
                        } else {
                            reject(errorMessage);
                        }
                    })
                    .catch((error: any) => reject(error));
            }, (error: any) => reject(error));
        });
    }

}
