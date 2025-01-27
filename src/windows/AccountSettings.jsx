import React, { useEffect, useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import { Type, notify } from '../components/Notifier.jsx';
import InputLabel from '../components/InputLabel.jsx';
import {
    verifyPassword,
    getUserName,
    updateDocInCollection,
    updateEmailInProjects,
    getDocumentIdByUserName,
    saveUserAccountChanges
} from '../utils/firestore';
import CryptoJS from 'crypto-js';
import { updateUserEmail } from '../App.jsx';

export default function AccountSettings({ CloseAccountSettings, emailProp }) {
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState(emailProp);
    const [emailChanged, setEmailChanged] = useState(false); // Track if email has been updated in the DB
    const originalEmail = emailProp;

    // Fetch user's current name
    useEffect(() => {
        const fetchUserName = async () => {
            const userName = await getUserName(email);
            setName(userName);
        };
        fetchUserName();
    }, [emailProp]);

    async function saveChanges() {
        // Step 1: Verify password
        const hashedPassword = CryptoJS.SHA256(password).toString();
        console.log("account details", originalEmail, hashedPassword);
        const isPasswordVerified = await verifyPassword(originalEmail, hashedPassword);
        if(!isPasswordVerified) {
            notify(Type.error, 'Please make sure the current password is correct.');
            return;
        }

        // Step 2: Detect any changes to the fields in component
        const fieldsChanged = await detectChanges();
        if(!fieldsChanged) {return;}

        // Step 3: Save changes to Firebase
        const success = saveUserAccountChanges(fieldsChanged, originalEmail);
        if(success) {
            notify(Type.success, 'Successfully updated account account.');
            CloseAccountSettings();
        } else {
            notify(Type.error, 'Something went wrong. Please verify all fields are correct.');
        }

    }

    async function detectChanges() {
        const fieldsChanged = {};
        const currentName = await getUserName(originalEmail);

        if (name !== currentName) fieldsChanged.name = name;
        if (email !== originalEmail) fieldsChanged.email = email;

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
            const newHash = CryptoJS.SHA256(newPassword).toString();
            fieldsChanged.password = newHash;
        }

        if (Object.keys(fieldsChanged).length === 0) {
            notify(Type.error, 'No changes detected.');
            return null;
        }

        return fieldsChanged;
    }



    async function saveChanges_old() {
        try {
            // Verify password matches current
            const hashedPassword = CryptoJS.SHA256(password).toString();
            console.log('LOGGING EMAIL', originalEmail); // Always verify using the original email
            const isPasswordVerified = await verifyPassword(originalEmail, hashedPassword);
            if (!isPasswordVerified) {
                notify(Type.error, 'Incorrect password');
                return;
            }

            // Check which fields have been changed by user
            const fieldsChanged = {};
            if (name !== (await getUserName(originalEmail))) fieldsChanged.name = name;
            if (email !== originalEmail) fieldsChanged.email = email;
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
                    return;
                }
                const newHash = CryptoJS.SHA256(newPassword).toString();
                fieldsChanged.password = newHash;
            }

            // If there are changes to save
            if (Object.keys(fieldsChanged).length > 0) {
                let userDocId = await getDocumentIdByUserName(originalEmail);
                if (fieldsChanged.email) {
                    console.log('AccountSettings get docId for user email:', userDocId);

                    // Update email in the "Users" collection
                    const emailUpdateSuccess = await updateDocInCollection('Users', userDocId, {
                        email: fieldsChanged.email,
                    });
                    if (!emailUpdateSuccess) {
                        notify(Type.error, 'Failed to update email.');
                        return;
                    }

                    // Update email across all projects
                    const projectsUpdateSuccess = await updateEmailInProjects(
                        originalEmail,
                        fieldsChanged.email,
                    );
                    if (projectsUpdateSuccess) {
                        console.log('Email updated across all projects.');
                        updateUserEmail(fieldsChanged.email); // Update the global email state
                        setEmailChanged(true); // Show the message only after a successful DB update
                    } else {
                        notify(Type.error, 'Failed to update email across all projects.');
                        // revert email back on user table
                        await updateDocInCollection('Users', userDocId, { email: originalEmail });
                        notify(Type.error, 'Email change rolled back because of an error.');
                        return;
                    }
                }

                // Update other fields in the "Users" collection
                const updatedData = {
                    ...fieldsChanged,
                    lastUpdated: new Date(),
                };
                const targetEmail = fieldsChanged.email || originalEmail; // Use the new email if it has been updated
                console.log('targetEmail', targetEmail);
                const updateSuccess = await updateDocInCollection('Users', userDocId, updatedData);

                if (updateSuccess) {
                    notify(Type.success, 'Changes saved successfully');
                    CloseAccountSettings();
                } else {
                    notify(Type.error, 'Failed to save changes');
                }
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            notify(Type.error, 'An unexpected error occurred while saving changes.');
        }
    }

    return (
        <WindowWrapper
            header="Account Settings"
            onLeftButton={() => {
                CloseAccountSettings();
            }}
            onRightButton={() => {
                saveChanges();
            }}
            leftButtonText="Back"
            rightButtonText="Save Changes"
        >
            <div className="flex flex-col space-y-4">
                {emailChanged && (
                    <div className="text-red-500 font-semibold bg-neutral-800 p-3 rounded">
                        To change your email again, please close out of this dialog and re-open it.
                        Otherwise, it will not work. Thanks!
                    </div>
                )}
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
                            onChange={(e) => {
                                setEmail(e.target.value);
                            }}
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
    );
}
