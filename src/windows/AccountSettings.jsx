import React, { useEffect, useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx'
import {Type, notify} from '../components/Notifier.jsx'
import { verifyPassword } from '../utils/firestore';
import InputLabel from '../components/InputLabel.jsx';

export default function AccountSettings({CloseAccountSettings, emailProp, nameProp}) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState(nameProp);
    const [email, setEmail] = useState(emailProp);

    // This updates notify() on every keystroke.. the error messages are kinda annoying
    // TODO: find a way to notify user just once about password mismatch.
    useEffect(() => {
        if(password && confirmPassword && password !== confirmPassword) {
            notify(Type.error, "Passwords do not match")
        }
    })

    return (
        <WindowWrapper
            header="Account Settings"
            onLeftButton={() => {CloseAccountSettings()}}
            onRightButton={() => {console.log("From right button")}}
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
                            onChange={(e) => {
                            setEmail(e.target.value);
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


