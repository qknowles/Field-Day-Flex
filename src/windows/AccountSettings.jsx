import React, { useEffect, useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import { Type, notify } from '../components/Notifier.jsx';
import InputLabel from '../components/InputLabel.jsx';
import {
    verifyPassword,
    getUserName,
    saveUserAccountChanges
} from '../utils/firestore';
import CryptoJS from 'crypto-js';
import { useAtom } from 'jotai';
import { currentUserEmail } from '../utils/jotai.js';

export default function AccountSettings({ CloseAccountSettings }) {
    const [email, setEmail] = useAtom(currentUserEmail);
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [changedEmail, setChangedEmail] = useState(email);

    useEffect(() => {
        const fetchUserName = async () => {
            const userName = await getUserName(email);
            setName(userName);
        };
        fetchUserName();
    }, [email]);

    async function saveChanges() {
        const hashedPassword = CryptoJS.SHA256(password).toString();
        console.log("current email value in saveChanges()", email);
        const isPasswordVerified = await verifyPassword(email, hashedPassword);
        if (!isPasswordVerified) {
            notify(Type.error, 'Please make sure the current password is correct.');
            return;
        }

        const fieldsChanged = await detectChanges();
        if (!fieldsChanged) return;

        const success = saveUserAccountChanges(fieldsChanged, email);
        if (success) {
            notify(Type.success, 'Successfully updated account.');
            setEmail(changedEmail);
            CloseAccountSettings();
        } else {
            notify(Type.error, 'Something went wrong. Please verify all fields are correct.');
        }
    }

    async function detectChanges() {
        const fieldsChanged = {};
        const currentName = await getUserName(email);

        if (name !== currentName) fieldsChanged.name = name;
        if (changedEmail !== email) fieldsChanged.email = changedEmail;

        if (newPassword && confirmPassword && newPassword === confirmPassword) {
            const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                notify(
                    Type.error,
                    (
                        <div>
                            Password must:
                            <ol>
                                <li>1. Be at least 8 characters long</li>
                                <li>2. Include at least one number</li>
                                <li>3. Include one special character</li>
                            </ol>
                        </div>
                    ),
                    10000
                );
                return null;
            }
            fieldsChanged.password = CryptoJS.SHA256(newPassword).toString();
        }

        if (Object.keys(fieldsChanged).length === 0) {
            notify(Type.error, 'No changes detected.');
            return null;
        }

        return fieldsChanged;
    }

    return (
        <WindowWrapper
            header="Account Settings"
            onLeftButton={CloseAccountSettings}
            onRightButton={saveChanges}
            leftButtonText="Back"
            rightButtonText="Save Changes"
        >
            <div className="flex flex-col space-y-4">
                {/*{changedEmail && (*/}
                {/*    <div className="text-red-500 font-semibold bg-neutral-800 p-3 rounded">*/}
                {/*        To change your email again, please close out of this dialog and re-open it.*/}
                {/*        Otherwise, it will not work. Thanks!*/}
                {/*    </div>*/}
                {/*)}*/}
                <InputLabel
                    label="Name"
                    layout="horizontal-single"
                    input={
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    }
                />
                <InputLabel
                    label="Email"
                    layout="horizontal-single"
                    input={
                        <input
                            type="email"
                            value={changedEmail}
                            onChange={(e) => setChangedEmail(e.target.value)}
                        />
                    }
                />
                <InputLabel
                    label="Current Password"
                    layout="horizontal-single"
                    input={
                        <input
                            type="password"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    }
                />
                <InputLabel
                    label="New Password"
                    layout="horizontal-single"
                    input={
                        <input
                            type="password"
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    }
                />
                <InputLabel
                    label="Confirm New Password"
                    layout="horizontal-single"
                    input={
                        <input
                            type="password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    }
                />
            </div>
        </WindowWrapper>
    );
}
