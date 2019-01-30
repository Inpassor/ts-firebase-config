"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const NodeCache = require("node-cache");
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
class FirebaseConfig {
    constructor(options) {
        this.host = 'firebaseremoteconfig.googleapis.com';
        this.scopes = [
            'https://www.googleapis.com/auth/firebase.remoteconfig',
        ];
        this.cacheOptions = null;
        this.projectId = null;
        this.keyFileName = null;
        this.key = null;
        this.keyId = null;
        this.path = null;
        this.defaultErrorMessage = 'Invalid response from the Firebase Remote Config service';
        this.cache = null;
        this.etag = null;
        Object.assign(this, options);
        this.path = `/v1/projects/${this.projectId}/remoteConfig`;
        this.cache = new NodeCache(this.cacheOptions || {});
    }
    getETag() {
        if (!this.etag) {
            this.etag = this.cache.get('--firebaseremoteconfig--etag--') || '*';
        }
        return this.etag;
    }
    setETag(etag) {
        if (etag && etag !== this.etag) {
            this.etag = etag;
            this.cache.set('--firebaseremoteconfig--etag--', this.etag);
        }
    }
    getAccessToken() {
        return new Promise((resolve, reject) => {
            if (this.keyFileName || (this.key && this.keyId)) {
                const clientOptions = {
                    scopes: this.scopes,
                };
                if (this.keyFileName) {
                    clientOptions.keyFile = this.keyFileName;
                }
                if (this.key && this.keyId) {
                    clientOptions.key = this.key;
                    clientOptions.keyId = this.keyId;
                }
                const jwtClient = new googleapis_1.google.auth.JWT(clientOptions);
                jwtClient.authorize((error, tokens) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(tokens.access_token);
                    }
                });
            }
            else {
                (new google_auth_library_1.Compute()).getAccessToken((error, token) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(token);
                    }
                });
            }
        });
    }
    get() {
        return new Promise((resolve, reject) => {
            this.getAccessToken().then((accessToken) => {
                node_fetch_1.default(`https://${this.host}${this.path}`, {
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
                            reject(response.statusText || this.defaultErrorMessage);
                        }
                    }
                    else {
                        reject(this.defaultErrorMessage);
                    }
                })
                    .then((data) => {
                    if (data && data.parameters) {
                        const parameters = {};
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
                    }
                    else {
                        resolve(null);
                    }
                })
                    .catch((error) => reject(error));
            }, (error) => reject(error));
        });
    }
    set(parameters) {
        return new Promise((resolve, reject) => {
            this.getAccessToken().then((accessToken) => {
                const body = {
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
                    if (response) {
                        if (response.status === 200) {
                            this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
                            resolve();
                        }
                        else {
                            reject(response.statusText || this.defaultErrorMessage);
                        }
                    }
                    else {
                        reject(this.defaultErrorMessage);
                    }
                })
                    .catch((error) => reject(error));
            }, (error) => reject(error));
        });
    }
}
exports.FirebaseConfig = FirebaseConfig;
//# sourceMappingURL=firebase-config.js.map