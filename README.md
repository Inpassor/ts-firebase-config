# Firebase Remote Config library

![](https://img.shields.io/npm/v/@inpassor/firebase-config.svg?style=flat)
![](https://img.shields.io/github/license/Inpassor/ts-firebase-config.svg?style=flat-square)
![](https://img.shields.io/npm/dt/@inpassor/firebase-config.svg?style=flat-square)

This library used for interaction with
[Firebase Remote Config](https://firebase.google.com/products/remote-config)
REST API to set or get
Remote Config values in node.js environment.

## Dependencies

### [google-auth-library](https://www.npmjs.com/package/google-auth-library)

The library uses **google-auth-library** npm package
and provides a variety of ways to authenticate Remote Config API requests:
- Provide a **keyId** and **key** of your Firebase project.
- Provide a **private key file** for your Firebase service account.
- Provide **GOOGLE_APPLICATION_CREDENTIALS** environment variable.
- Use none of above in case of usage of the library on Google Cloud.

Read about Google Cloud API authentication at
[Getting Started with Authentication](https://cloud.google.com/docs/authentication/getting-started)

### [node-cache](https://www.npmjs.com/package/node-cache)

The library uses **node-cache** npm package for storing ETag value.

See **cacheOptions** config option.

### [flat](https://www.npmjs.com/package/flat)

The library uses **flat** npm package for flatten and unflatten Remote Config parameters.

See **delimiter** config option.


## Example

```typescript
import * as path from 'path';
import {
    FirebaseConfig,
    DataObject,
} from '@inpassor/firebase-config';

/**
 * Instantiate FirebaseConfig
 */
const firebaseConfig = new FirebaseConfig({
    projectId: 'my-awesome-project-id',
    keyFileName: path.resolve('path', 'to', 'my-awesome-project-service-key.json'),
    // key: 'my-project-key',
    // keyId: 'my-project-key-id',
    // cacheOptions: {
    //     forceString?: boolean;
    //     objectValueSize?: number;
    //     arrayValueSize?: number;
    //     stdTTL?: number;
    //     checkperiod?: number;
    //     useClones?: boolean;
    //     errorOnMissing?: boolean;
    //     deleteOnExpire?: boolean;
    // },
    // delimiter: '___',
    // defaultErrorMessage: 'Invalid response from the Firebase Remote Config service',
});

/**
 * Set Remote Config 
 */
firebaseConfig.set({
    // [key: string]: any
}).then(
    () => console.log('published'),
    (error: any) => console.error(error),
);

/**
 * Get Remote Config 
 */
firebaseConfig.get().then(
    (parameters: DataObject) => console.log(parameters),
    (error: any) => console.error(error),
);
```
