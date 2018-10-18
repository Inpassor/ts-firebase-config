"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const node_fetch_1 = require("node-fetch");
const googleapis_1 = require("googleapis");
const NodeCache = require("node-cache");
class FirebaseConfig {
    constructor(options) {
        this.host = 'firebaseremoteconfig.googleapis.com';
        this.scopes = [
            'https://www.googleapis.com/auth/firebase.remoteconfig',
        ];
        this.cacheOptions = null;
        this.projectId = null;
        this.keyFileName = null;
        this.path = null;
        this._cache = null;
        this._etag = null;
        Object.assign(this, options);
        this.path = `/v1/projects/${this.projectId}/remoteConfig`;
        this._cache = new NodeCache(this.cacheOptions || {});
    }
    getETag() {
        if (!this._etag) {
            this._etag = this._cache.get('--firebaseremoteconfig--etag--') || '*';
        }
        return this._etag;
    }
    setETag(etag) {
        if (etag && etag !== this._etag) {
            this._etag = etag;
            this._cache.set('--firebaseremoteconfig--etag--', this._etag);
        }
    }
    getAccessToken() {
        return new Promise((resolve, reject) => {
            const key = JSON.parse(fs.readFileSync(this.keyFileName, 'utf8'));
            const jwtClient = new googleapis_1.google.auth.JWT(key.client_email, null, key.private_key, this.scopes, null);
            jwtClient.authorize((error, tokens) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(tokens.access_token);
                }
            });
        });
    }
    get(version) {
        return new Promise((resolve, reject) => {
            this.getAccessToken().then((accessToken) => {
                const errorMessage = 'Invalid response from the Firebase Remote Config service';
                node_fetch_1.default(`https://${this.host}${this.path}${version ? `?version_number=${version}` : ''}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept-Encoding': 'gzip',
                    },
                })
                    .then((response) => {
                    if (response) {
                        if (response.status === 200) {
                            this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
                            return response.json();
                        }
                        else {
                            reject(response.statusText || errorMessage);
                        }
                    }
                    else {
                        reject(errorMessage);
                    }
                })
                    .then((data) => {
                    if (data && data.parameters) {
                        const config = {};
                        for (const key in data.parameters) {
                            if (data.parameters.hasOwnProperty(key)) {
                                config[key] = data.parameters[key]
                                    && data.parameters[key].defaultValue
                                    && data.parameters[key].defaultValue.value;
                            }
                        }
                        resolve(config);
                    }
                    else {
                        reject(errorMessage);
                    }
                })
                    .catch((error) => reject(error));
            }, (error) => reject(error));
        });
    }
    set(config) {
        return new Promise((resolve, reject) => {
            this.getAccessToken().then((accessToken) => {
                const body = {
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
                node_fetch_1.default(`https://${this.host}${this.path}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json; UTF-8',
                        'Accept-Encoding': 'gzip',
                        'If-Match': this.getETag(),
                    },
                    body: JSON.stringify(body),
                })
                    .then((response) => {
                    const errorMessage = 'Invalid response from the Firebase Remote Config service';
                    if (response) {
                        if (response.status === 200) {
                            this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
                            resolve();
                        }
                        else {
                            reject(response.statusText || errorMessage);
                        }
                    }
                    else {
                        reject(errorMessage);
                    }
                })
                    .catch((error) => reject(error));
            }, (error) => reject(error));
        });
    }
}
exports.FirebaseConfig = FirebaseConfig;
//# sourceMappingURL=firebase-config.js.map