/*******
 GoogleAuthWrapper.js

 Wrapper to handle Google OAuth and integrate it with the already-existing backend

 This is a hacky implementation that reuses components from Login.jsx.
 IDEALLY, we need to combine these two classes (or even make the login history its own class)
 However, to refactor the entire authentication of this app is out of scope right now.
 that's, realistically, probably a week's work thinking in terms of these capstone projects.
 To future capstone teams: do that. we are just currently in april and do not have the time
 */

//import React from 'react';
import { useSetAtom } from 'jotai';
import { currentUserEmail, isAuthenticated } from '../utils/jotai';
import { db } from '../utils/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { notify, Type } from '../components/Notifier';

export default function GoogleAuthWrapper({ OpenAccount }) {
    const setEmail = useSetAtom(currentUserEmail);
    const setAuthenticated = useSetAtom(isAuthenticated);

    const googleAuth = new GoogleAuthWrapper();

    const recordLoginHistory = async (email) => {
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
            console.log(`Google login recorded for: ${email}`);
        } catch (error) {
            console.error('Error recording Google login:', error);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const user = await googleAuth.signInWithGoogle();
            if (!user?.email) throw new Error('No email returned from Google');

            setEmail(user.email);
            setAuthenticated(true);
            await recordLoginHistory(user.email);
            notify(Type.success, 'Google login successful.');
            OpenAccount(); // same function used in Login
        } catch (error) {
            notify(Type.error, 'Google login failed.');
            console.error(error);
        }
    };

    return (
        <button onClick={handleGoogleLogin} className="your-button-class">
            Sign in with Google
        </button>
    );
}
