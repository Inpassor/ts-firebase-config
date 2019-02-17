"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const flat_1 = require("flat");
const NodeCache = require("node-cache");
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
        this.delimiter = '___';
        this.cache = null;
        this.etag = null;
        Object.assign(this, options);
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
    getProjectId() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(this.projectId || (yield google_auth_library_1.auth.getProjectId()));
        });
    }
    getPath() {
        return __awaiter(this, void 0, void 0, function* () {
            const projectId = yield this.getProjectId();
            return Promise.resolve(this.path || `/v1/projects/${projectId}/remoteConfig`);
        });
    }
    getClient() {
        return __awaiter(this, void 0, void 0, function* () {
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
                return Promise.resolve(new google_auth_library_1.JWT(clientOptions));
            }
            return yield google_auth_library_1.auth.getClient({
                scopes: this.scopes,
            });
        });
    }
    getAuthHeaders() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getProjectId(),
                this.getClient(),
            ]).then(([projectId, client]) => {
                client.getRequestHeaders().then((headers) => {
                    headers['Accept-Encoding'] = 'gzip';
                    resolve(headers);
                }, (error) => reject(error));
            }, (error) => reject(error));
        });
    }
    get() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getClient(),
                this.getAuthHeaders(),
                this.getPath(),
            ]).then(([client, headers, path]) => {
                client.request({
                    url: `https://${this.host}${path}`,
                    headers,
                }).then((response) => {
                    if (response) {
                        if (response.status === 200) {
                            this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
                            const data = response.data;
                            if (data && data.parameters) {
                                const parameters = {};
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
                                resolve(flat_1.unflatten(parameters, {
                                    delimiter: this.delimiter,
                                }));
                            }
                            else {
                                resolve(null);
                            }
                        }
                        else {
                            reject(response.statusText || this.defaultErrorMessage);
                        }
                    }
                    else {
                        reject(this.defaultErrorMessage);
                    }
                }, (error) => reject(error));
            }, (error) => reject(error));
        });
    }
    set(parameters) {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getClient(),
                this.getAuthHeaders(),
                this.getPath(),
            ]).then(([client, headers, path]) => {
                const body = {
                    parameters: {},
                };
                const flattenParameters = flat_1.flatten(parameters, {
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
                }).then((response) => {
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
                }, (error) => reject(error));
            }, (error) => reject(error));
        });
    }
}
exports.FirebaseConfig = FirebaseConfig;
//# sourceMappingURL=firebase-config.js.map