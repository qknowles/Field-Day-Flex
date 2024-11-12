import React, { useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';
import { accountExists, verifyPassword } from '../utils/firestore';
import CryptoJS from 'crypto-js';

export default function Login({ CancelLogin, OpenAccount, SetEmail }) {
    const [thisEmail, setThisEmail] = useState('');
    const [password, setPassword] = useState('');

    const attemptLogin = async () => {

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(thisEmail)) {
            notify(Type.error, 'Please enter a valid email address.');
            return;
        }
        if (password.length < 1) {
            notify(
                Type.error, 'Please enter a password.',
            );
            return;
        }

        const exists = await accountExists(thisEmail);
        if (exists) {
            const hashedPassword = CryptoJS.SHA256(password).toString();
            const passwordIsCorrect = await verifyPassword(thisEmail, hashedPassword);
            if (passwordIsCorrect) {
                SetEmail(thisEmail);
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
                    layout="horizontal"
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
                    layout="horizontal"
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
