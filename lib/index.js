"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const flat_1 = require("flat");
const NodeCache = require("node-cache");
const google_auth_library_1 = require("google-auth-library");
class FirebaseConfig {
    constructor(options) {
        this.projectId = null;
        this.keyFileName = null;
        this.key = null;
        this.keyId = null;
        this.cacheOptions = {};
        this.delimiter = '___';
        this.defaultErrorMessage = 'Invalid response from the Firebase Remote Config service';
        this.client = null;
        this.cache = null;
        this.etag = null;
        Object.assign(this, options);
        this.cache = new NodeCache(this.cacheOptions);
    }
    getProjectId() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.projectId) {
                this.projectId = yield google_auth_library_1.auth.getProjectId();
            }
            return this.projectId;
        });
    }
    getClient() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                const scopes = 'https://www.googleapis.com/auth/firebase.remoteconfig';
                if (this.keyFileName || (this.key && this.keyId)) {
                    const clientOptions = {
                        scopes,
                    };
                    if (this.keyFileName) {
                        clientOptions.keyFile = this.keyFileName;
                    }
                    if (this.key && this.keyId) {
                        clientOptions.key = this.key;
                        clientOptions.keyId = this.keyId;
                    }
                    this.client = new google_auth_library_1.JWT(clientOptions);
                }
                else {
                    this.client = yield google_auth_library_1.auth.getClient({
                        scopes,
                    });
                }
            }
            return this.client;
        });
    }
    getRequestHeaders() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.getClient();
            const headers = yield client.getRequestHeaders();
            headers['Accept-Encoding'] = 'gzip';
            return headers;
        });
    }
    getUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            const projectId = yield this.getProjectId();
            return `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig`;
        });
    }
    encodeParameters(parameters, conditions, conditionalValues) {
        const body = {};
        if (conditions) {
            body.conditions = [];
            for (const key in conditions) {
                if (conditions.hasOwnProperty(key)) {
                    body.conditions.push({
                        name: key,
                        expression: conditions[key],
                    });
                }
            }
        }
        body.parameters = {};
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
        if (conditionalValues) {
            for (const key in conditionalValues) {
                if (conditionalValues.hasOwnProperty(key)) {
                    body.parameters[key].conditionalValues = {};
                    for (const conditionalValueName in conditionalValues[key]) {
                        if (conditionalValues[key].hasOwnProperty(conditionalValueName)) {
                            body.parameters[key].conditionalValues[conditionalValueName] = {
                                value: conditionalValues[key][conditionalValueName],
                            };
                        }
                    }
                }
            }
        }
        return JSON.stringify(body);
    }
    decodeParameters(data) {
        if (data && data.parameters) {
            const parameters = {};
            for (const key in data.parameters) {
                if (data.parameters.hasOwnProperty(key)) {
                    const value = data.parameters[key]
                        && data.parameters[key].defaultValue
                        && data.parameters[key].defaultValue.value;
                    if (value) {
                        try {
                            parameters[key] = JSON.parse(value);
                        }
                        catch (e) {
                            parameters[key] = value;
                        }
                    }
                }
            }
            return flat_1.unflatten(parameters, {
                delimiter: this.delimiter,
            });
        }
        else {
            return null;
        }
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
    set(parameters, conditions, conditionalValues) {
        return __awaiter(this, void 0, void 0, function* () {
            const [client, headers, url] = yield Promise.all([
                this.getClient(),
                this.getRequestHeaders(),
                this.getUrl(),
            ]);
            headers['Content-Type'] = 'application/json; UTF-8';
            headers['If-Match'] = this.getETag();
            const response = yield client.request({
                url,
                method: 'PUT',
                headers,
                body: this.encodeParameters(parameters, conditions, conditionalValues),
            });
            if (response && response.status === 200) {
                this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
                return;
            }
            throw new Error(response.statusText || this.defaultErrorMessage);
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            const [client, headers, url] = yield Promise.all([
                this.getClient(),
                this.getRequestHeaders(),
                this.getUrl(),
            ]);
            const response = yield client.request({
                url,
                headers,
            });
            if (response && response.status === 200) {
                this.setETag(response.headers && response.headers.get && response.headers.get('etag'));
                return this.decodeParameters(response.data);
            }
            throw new Error(response.statusText || this.defaultErrorMessage);
        });
    }
}
exports.FirebaseConfig = FirebaseConfig;
//# sourceMappingURL=index.js.map