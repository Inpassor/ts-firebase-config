# Firebase Remote Config library

## Quick example

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
firebaseConfig.get().then((config: Data) => {
    console.log(config);
}, (error: any) => {
    console.error(error);
});
```
