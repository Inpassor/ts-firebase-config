# Firebase Remote Config library

![](https://img.shields.io/npm/v/@inpassor/firebase-config.svg?style=flat)
![](https://img.shields.io/github/license/Inpassor/ts-firebase-config.svg?style=flat-square)
![](https://img.shields.io/npm/dt/@inpassor/firebase-config.svg?style=flat-square)

https://firebase.google.com/products/remote-config/

This library used for interaction with Firebase Remote Config REST API to set or get
Remote Config values in Node.js environment.

For storing ETag value the library uses
[node-cache](https://www.npmjs.com/package/node-cache) npm package.

To authorize Remote Config API requests the library have three options on your choice:
- Provide a **private key file** for your service account.
- Provide a **key** and **keyId** of your Firebase project.
- Use none of above in case of usage of the library in the Firebase environment.

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
    keyFileName: path.resolve('path-to', 'my-awesome-project-service-key.json'),
    // key: 'my-project-key',
    // keyId: 'my-project-key-id',
    // cacheOptions: {
    //     stdTTL?: number;
    //     checkperiod?: number;
    //     errorOnMissing?: boolean;
    //     useClones?: boolean;
    //     deleteOnExpire?: boolean;
    // },
});

/**
 * Set Remote Config 
 */
firebaseConfig.set({
    // [key: string]: any
}).then(() => {
    console.log('published');
}, (error: any) => {
    console.error(error);
});

/**
 * Get Remote Config 
 */
firebaseConfig.get().then((parameters: DataObject) => {
    console.log(parameters);
}, (error: any) => {
    console.error(error);
});
```
