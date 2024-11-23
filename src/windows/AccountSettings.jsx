import React, { useEffect, useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx'
import {Type, notify} from '../components/Notifier.jsx'
import InputLabel from '../components/InputLabel.jsx';
import { verifyPassword, getUserName, updateDocInCollection } from '../utils/firestore';
import CryptoJS from 'crypto-js';

export default function AccountSettings({CloseAccountSettings, emailProp}) {
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState(emailProp);

    async function saveChanges() {
        // Verify password matches current
        const hashedPassword = CryptoJS.SHA256(password).toString();
        const isPasswordVerified = await verifyPassword(emailProp, hashedPassword);
        if (!isPasswordVerified) {
            notify(Type.error, 'Incorrect password');
            return;
        }

        // Check which fields have been changed by user and log them
        const fieldsChanged = {};
        if (name !== await getUserName(emailProp)) fieldsChanged.name = name;
        //if (email !== emailProp) fieldsChanged.email = email;
        if (newPassword && confirmPassword && newPassword === confirmPassword) {
            const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                notify(
                    Type.error,
                    'Password must be at least 8 characters long and include at least one number and one special character.',
                );
                return;
            }
            const newHash = CryptoJS.SHA256(newPassword).toString();
            fieldsChanged.password = newHash;
        }

        // update query with all the changed data
        if (Object.keys(fieldsChanged).length > 0) {
            const updatedData = {
                ...fieldsChanged,
                lastUpdated: new Date()
            };
            const success = await updateDocInCollection('Users', emailProp, updatedData);
            if (success) {
                notify(Type.success, 'Changes saved successfully');
            } else {
                notify(Type.error, 'Failed to save changes');
            }
        }
    }

    // This updates notify() on every keystroke.. the error messages are kinda annoying
    // TODO: find a way to notify user just once about password mismatch.
    useEffect(() => {
        if(newPassword && confirmPassword && newPassword !== confirmPassword) {
            notify(Type.error, "Passwords do not match")
        }
    })

    // getUserName is async and returns a promise
    useEffect(() => {
            const fetchUserName = async () => {
                const userName = await getUserName(emailProp);
                setName(userName);
            };
            fetchUserName();
        }, [emailProp]
    );

    return (
        <WindowWrapper
            header="Account Settings"
            onLeftButton={() => {CloseAccountSettings()}}
            onRightButton={() => {saveChanges()}}
            leftButtonText="Cancel"
            rightButtonText="Save Changes"
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
                            value={email}
                            readOnly
                            className="cursor-not-allowed"
                        />
                    }
                />
                <InputLabel
                    label="Current Password"
                    layout="horizontal-single"
                    input={
                        <input
                            type="password"
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }}
                        />
                    }
                />
                <InputLabel
                    label="New Password"
                    layout="horizontal-single"
                    input={
                        <input
                            type="password"
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                            }}
                        />
                    }
                />
                <InputLabel
                    label="Confirm New Password"
                    layout="horizontal-single"
                    input={
                        <input
                            type="password"
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                            }}
                        />
                    }
                />
            </div>
        </WindowWrapper>
    )
}


