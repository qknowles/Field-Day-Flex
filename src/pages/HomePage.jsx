import React, { useState } from 'react';
import Button from '../components/Button';
import PageWrapper from '../wrappers/PageWrapper';
import { LizardIcon } from '../assets/icons';
import NewAccount from '../windows/NewAccount';
import Login from '../windows/Login';

export default function HomePage({ SetAuthenticated, SetEmail }) {
    const [showNewAccount, setShowNewAccount] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    const openNewAccount = () => setShowNewAccount(true);
    const closeNewAccount = () => setShowNewAccount(false);

    const openLogin = () => setShowLogin(true);
    const closeLogin = () => setShowLogin(false);

    const openAccount = () => {
        if (showNewAccount) setShowNewAccount(false);
        if (showLogin) setShowLogin(false);
        SetAuthenticated(true);
    };

    return (
        <PageWrapper>
            {showNewAccount && (
                <NewAccount
                    CancelAccount={closeNewAccount}
                    OpenNewAccount={openAccount}
                    SetEmail={SetEmail}
                />
            )}
            {showLogin && (
                <Login CancelLogin={closeLogin} OpenAccount={openAccount} SetEmail={SetEmail} />
            )}
            {!showNewAccount && !showLogin && (
                <HomeScreen OpenLogin={openLogin} OpenNewAccount={openNewAccount} />
            )}
        </PageWrapper>
    );
}

const HomeScreen = ({ OpenLogin, OpenNewAccount }) => (
    <>
        <div className="pt-10">
            <h1 className="title">
                Field Day <br />
                <span
                    style={{
                        fontFamily: '"Lucida Handwriting", cursive',
                        fontSize: '0.7em',
                        position: 'relative',
                        top: '-0.3em',
                    }}
                >
                    Flex
                </span>
            </h1>
            <h2
                className="subtitle"
                style={{
                    position: 'relative',
                    top: '-0.7em',
                }}
            >
                Data Management Tool
            </h2>
        </div>
        <div
            className="m-5 p-10 rounded-lg shadow-md bg-white dark:bg-neutral-950 mx-auto w-full md:w-96"
            style={{
                position: 'relative',
                top: '-3.0em',
            }}
        >
            <div className="flex flex-col space-y-5">
                <Button onClick={OpenLogin} text="Login" disabled={false} />
                <Button onClick={OpenNewAccount} text="Create Account" disabled={false} />
            </div>
        </div>
        <div
            style={{
                position: 'relative',
                top: '-5.0em',
            }}
        >
            <LizardIcon className="text-asu-maroon h-48 mx-auto rotate-45" />
        </div>
    </>
);
