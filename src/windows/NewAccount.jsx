import React, { useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';
import { accountExists, createAccount } from '../utils/firestore';
import CryptoJS from 'crypto-js';

export default function NewAccount({ CancelAccount, OpenNewAccount, SetEmail }) {
    const [name, setName] = useState('');
    const [thisEmail, setThisEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const createClick = async () => {

        if (name.trim().length === 0) {
            notify(Type.error, 'Please enter a name.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(thisEmail)) {
            notify(Type.error, 'Please enter a valid email address.');
            return;
        }
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(password)) {
            notify(
                Type.error,
                'Password must be at least 8 characters long and include at least one number and one special character.',
            );
            return;
        }
        if (password !== confirmPassword) {
            notify(Type.error, 'Passwords do not match.');
            return;
        }

        const exists = await accountExists(thisEmail);
        if (exists) {
            notify(Type.error, 'Account already exists.');
            return;
        } else {
            const hashedPassword = CryptoJS.SHA256(password).toString();
            const created = await createAccount(name, thisEmail, hashedPassword);
            if (created) {
                SetEmail(thisEmail);
                notify(Type.success, 'Account created successfully.');
                OpenNewAccount();
            } else {
                notify(Type.error, 'Failed to create account.');
                CancelAccount();
            }
        }
    };

    return (
        <WindowWrapper
            header="Create Account"
            onLeftButton={CancelAccount}
            onRightButton={createClick}
            leftButtonText="Cancel"
            rightButtonText="Create"
        >
            <div className="flex flex-col space-y-4">
                <InputLabel
                    label="Name"
                    layout="horizontal-single"
                    input={
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                            }}
                        />
                    }
                />
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
                <InputLabel
                    label="Confirm Password"
                    layout="horizontal-single"
                    input={
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                            }}
                        />
                    }
                />
            </div>
        </WindowWrapper>
    );
}
