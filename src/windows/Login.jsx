import React, { useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';
import { accountExists, verifyPassword } from '../utils/firestore';
import CryptoJS from 'crypto-js';
import { useSetAtom } from 'jotai';
import { currentUserEmail, isAuthenticated } from '../utils/jotai.js';
import { db } from '../utils/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function Login({ CancelLogin, OpenAccount }) {
    const [thisEmail, setThisEmail] = useState('');
    const [password, setPassword] = useState('');
    const setEmail = useSetAtom(currentUserEmail);
    const setAuthenticated = useSetAtom(isAuthenticated);

    const recordLoginHistory = async (email) => {
        try {
            const loginHistoryRef = collection(db, 'loginHistory');
            const now = new Date();
            await addDoc(loginHistoryRef, {
                email: email,
                loginDate: now.toLocaleDateString(),
                loginTime: now.toLocaleTimeString(),
                platform: 'desktop',
                type: 'manual_login' // To identify manual logins
            });
            console.log(`Login recorded for: ${email}`);
        } catch (error) {
            console.error('Error recording login history:', error);
        }
    };

    const attemptLogin = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(thisEmail)) {
            notify(Type.error, 'Please enter a valid email address.');
            return;
        }
        if (password.length < 1) {
            notify(Type.error, 'Please enter a password.');
            return;
        }

        const exists = await accountExists(thisEmail);
        if (exists) {
            const hashedPassword = CryptoJS.SHA256(password).toString();
            const passwordIsCorrect = await verifyPassword(thisEmail, hashedPassword);
            if (passwordIsCorrect) {
                setEmail(thisEmail);
                setAuthenticated(true); // Set authenticated state
                await recordLoginHistory(thisEmail);
                notify(Type.success, 'Login successful.');
                OpenAccount();
            } else {
                notify(Type.error, 'Incorrect email or password.');
            }
        } else {
            notify(Type.error, 'Incorrect email or password.');
        }
    };

    return (
        <WindowWrapper
            header="Login"
            onLeftButton={CancelLogin}
            onRightButton={attemptLogin}
            leftButtonText="Cancel"
            rightButtonText="Login"
        >
            <div className="flex flex-col space-y-4">
                <InputLabel
                    label="Email"
                    layout="horizontal-single"
                    input={
                        <input
                            type="email"
                            value={thisEmail}
                            onChange={(e) => {
                                setThisEmail(e.target.value);
                            }}
                        />
                    }
                />
                <InputLabel
                    label="Password"
                    layout="horizontal-single"
                    input={
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }}
                        />
                    }
                />
            </div>
        </WindowWrapper>
    );
}
