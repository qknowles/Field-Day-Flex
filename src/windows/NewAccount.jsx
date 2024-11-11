import React, { useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';

export default function NewAccount({ onCancel }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    return (
        <WindowWrapper
            header="Create Account"
            onLeftButton={onCancel}
            onRightButton={() => {}}
            leftButtonText="Cancel"
            rightButtonText="Create"
        >
            <div className="flex flex-col space-y-4">
                <InputLabel
                    label="Name"
                    layout="horizontal"
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
                    layout="horizontal"
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
                <InputLabel
                    label="Confirm Password"
                    layout="horizontal"
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
