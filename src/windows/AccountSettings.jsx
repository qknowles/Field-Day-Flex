/**
 * File: AccountSettings.jsx
 *
 * Description:
 * This component manages the "Account Settings" window for users to make modifications
 * to their account details such as their name, email, and password. It provides validation,
 * notification feedback, and saves updates securely using backend utility functions.
 *
 * Props:
 * - `CloseAccountSettings` (function): A callback function to close the "Account Settings" window.
 *
 * State Variables:
 * - `email` (string): The current email of the user (managed via Jotai `currentUserEmail` atom).
 * - `password` (string): The current password entered by the user for verification.
 * - `newPassword` (string): The new password entered by the user.
 * - `confirmPassword` (string): Confirmation of the new password entered.
 * - `name` (string): The user's name, editable through the UI.
 * - `changedEmail` (string): The updated email entered by the user.
 *
 * Last Modified: 1/31/2025
 */

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

    /**
     * Updates the local username if it is changed
     *
     * TODO: refactor to define fetchUserName in firestore.js or something like that.
     */
    useEffect(() => {
        const fetchUserName = async () => {
            const userName = await getUserName(email);
            setName(userName);
        };
        fetchUserName();
    }, [email]);

    /**
     * Function: saveChanges
     *
     * Description:
     * Handles saving any account changes made within the "Account Settings" UI.
     *
     * Behavior:
     * 1. Hashes the current password entered by the user.
     * 2. Verifies if the hashed password matches the actual password stored in the backend using `verifyPassword`.
     * 3. If the password verification fails:
     *    - Triggers an error notification using `notify`.
     * 4. Calls the `detectChanges` function to detect any modifications to the user's account details:
     *    - This includes changes to the user's name, email, or password.
     * 5. If any valid changes are detected:
     *    - Updates the account using `saveUserAccountChanges`.
     *    - Displays a success message upon a successful update and closes the settings window.
     *    - Updates the email in the global state to reflect any changes.
     * 6. If the update fails, displays an error notification.
     *
     * Returns:
     * - void
     */
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

        const success = await saveUserAccountChanges(fieldsChanged, email);
        if (success) {
            notify(Type.success, 'Successfully updated account.');
            setEmail(changedEmail);
            CloseAccountSettings();
        } else {
            notify(Type.error, 'Something went wrong. Please verify all fields are correct.');
        }
    }

    /**
     * Function: detectChanges
     *
     * Description:
     * Detects if any valid changes have been made to the account settings.
     *
     * Behavior:
     * 1. Compares the current name, email, or password with their previous (unchanged) values.
     * 2. If there's a difference:
     *    - Updates the `fieldsChanged` object with the modified fields (`name`, `email`, or `password`).
     * 3. Validates the new password if it has been changed:
     *    - Ensures it meets the following criteria:
     *      - Minimum of 8 characters.
     *      - Includes at least one number.
     *      - Includes at least one special character.
     *    - Notifies the user if the password does not meet the criteria.
     * 4. Returns `null` if no changes are detected or if the password is invalid.
     * 5. If valid changes exist, returns an object containing all the modified fields.
     *
     * Returns:
     * - fieldsChanged (object): An object containing the fields that have been modified.
     *   Example structure:
     *   {
     *       name: 'New Name',
     *       email: 'new.email@example.com',
     *       password: 'hashed_new_password'
     *   }
     * - null: If no changes are detected or new password criteria are not met.
     *
     * Notifications:
     * - Triggers notifications to inform the user of:
     *   - Invalid password criteria.
     *   - No detected changes.
     */
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
                    10000 // ms, 10 seconds
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
