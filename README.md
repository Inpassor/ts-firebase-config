# Firebase Remote Config library

https://firebase.google.com/products/remote-config/

## Example

```typescript
import * as path from 'path';
import {
    FirebaseConfig,
    Data,
} from '@inpassor/firebase-config';

/**
 * Instantiate FirebaseConfig
 */
const firebaseConfig = new FirebaseConfig({
    projectId: 'my-awesome-project-id',
    keyFileName: path.resolve('path-to', 'my-awesome-project-service-key.json'),
    // cacheOptions: {
    //     stdTTL?: number;
    //     checkperiod?: number;
    //     errorOnMissing?: boolean;
    //     useClones?: boolean;
    //     deleteOnExpire?: boolean;
    // },
});

/**
 * Force remote config publish (ETag = *) 
 */
firebaseConfig.set({
    // [key: string]: any
}).then(() => {
    console.log('published');
}, (error: any) => {
    console.error(error);
});

/**
 * Get remote config 
 */
firebaseConfig.get().then((parameters: Data) => {
    console.log(parameters);
}, (error: any) => {
    console.error(error);
});
```
