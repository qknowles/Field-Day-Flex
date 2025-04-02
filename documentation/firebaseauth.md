Steps to integrate FirebaseAuth into Flex:

NOTE: Spark plan (free Firebase tier) has free authentication services as well for up to 3,000 daily active users
I take it Flex will probably never have more than that many daily users but maybe we should note this somewhere

Has a prebuilt UI but I take it that our current version is fine enough if we just link up the firebase backend to it.

1. initialize and add SDK

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
// ...
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
```


2. we can keep the login JWT if we want.
- to integrate this with current code, store email in jotai as we currently do?
    - instead: store session token there? -- this would definitely break everything else
- if we move to this new authentication service, how does that effect code like the login history?


3. signing in is easy:
   import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

```
const auth = getAuth();
createUserWithEmailAndPassword(auth, email, password)
.then((userCredential) => {
// Signed up
const user = userCredential.user;
// ...
})
.catch((error) => {
const errorCode = error.code;
const errorMessage = error.message;
// ..
});
```

a UserCredential contain:
- operationType :: type of operation used to sign in (sign-in, link, etc)
- providerId    :: the provider used to authenticate the user (google OAuth, facebook, GitHub, etc, any provider)
- user 		:: the user authenticated by the credential

a User object:
- emailVerified, isAnonymous, metadata, providerData (UserInfo[]), refresh token, tenantId
- user.getIdToken() :: returns a JWT to identify the user to firebase
- user.refreshToken() :: reauthenticates the user, avoid using this!! --> use User.getIdToken() instead
