/*******
 GoogleAuthWrapper.js

 Wrapper to handle Google OAuth and integrate it with the already-existing backend

 This is a hacky implementation that reuses components from Login.jsx.
 IDEALLY, we need to combine these two classes (or even make the login history its own class)
 However, to refactor the entire authentication of this app is out of scope right now.
 that's, realistically, probably a week's work thinking in terms of these capstone projects.
 To future capstone teams: do that. we are just currently in april and do not have the time.

 Google OAuth is worth it to have though, for instance, if some feature in the future requires a google account,
 we can use the accessToken given from GoogleAuthProvider to access Google's APIs.
 *******/

import { store } from 'jotai';
import { currentUserEmail, isAuthenticated } from './jotai.js';
import { db, auth } from './firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import { notify, Type } from '../components/Notifier';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { accountExists } from './firestore.js';

class GoogleAuthWrapper {
    async signInWithGoogle() {
        const provider = new GoogleAuthProvider();

        try {
            // Step 1: Trigger Google OAuth popup
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            if (!user) throw new Error("Google Auth failed: No user returned");
            if (!user.email) throw new Error("No email returned from Google OAuth");

            // Step 2: Mirror Login.jsx and log the user log in (if successful)
            const email = user.email;
            const exists = await accountExists(email);
            if(exists) {
                await this.recordLoginHistory(email);
            } else {
                notify(Type.error, "You do not have an account! Please create one.");
                return false;
            }

            // Step 3: Use jotai's store to defeat the entire purpose of Jotai and Login.jsx
            // this is what I mean, these classes need to be refactored together
            store.set(currentUserEmail, email);
            store.set(isAuthenticated, true);

            console.log(`Google login successful for ${email}`);
            notify(Type.success, 'Google login successful.');
            return true;
        } catch (error) {
            console.error('Google login failed:', error);
            notify(Type.error, 'Google login failed. Try using your email and password.');
            return false;
        }
    }

    /* login.jsx functions */
    // THIS IS THE FUNCTION FROM LOGIN.JSX COPY AND PASTED (mostly)
    async recordLoginHistory(email) {
        try {
            const loginHistoryRef = collection(db, 'loginHistory');
            const now = new Date();
            await addDoc(loginHistoryRef, {
                email: email,
                loginDate: now.toLocaleDateString(),
                loginTime: now.toLocaleTimeString(),
                platform: 'desktop',
                type: 'google_login'
            });
            console.log(`Login recorded for: ${email}`);
        } catch (error) {
            console.error('Error recording login history:', error);
        }
    }
}

const googleAuthWrapper = new GoogleAuthWrapper();
export default googleAuthWrapper;
