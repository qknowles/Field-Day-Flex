import React, { useState } from 'react';
import Button from '../components/Button';
import PageWrapper from '../wrappers/PageWrapper';
import { GoogleIcon, LizardIcon } from '../assets/icons';
import NewAccount from '../windows/NewAccount';

export default function LoginPage({ auth, setAuthenticated }) {
    const [showNewAccount, setShowNewAccount] = useState(false);
    const LOADING_MESSAGE = "Loading Google's authentication.";
    const LOGIN_MESSAGE = 'Click login to sign in with your ASURITE ID.';

    const openNewAccount = () => setShowNewAccount(true);
    const closeNewAccount = () => setShowNewAccount(false);

    return (
        <PageWrapper>
            {showNewAccount ? (
                <NewAccount onCancel={closeNewAccount} />
            ) : (
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
                            <p>{auth.loading ? LOADING_MESSAGE : LOGIN_MESSAGE}</p>
                            <Button
                                onClick={async () => setAuthenticated(await auth.login())}
                                text={!auth.loading ? 'Login' : 'Please wait.'}
                                disabled={auth.loading}
                                icon={
                                    <div className="bg-white rounded-full p-1 dark:bg-black">
                                        <GoogleIcon />
                                    </div>
                                }
                            />
                            <Button
                                onClick={openNewAccount}
                                text={!auth.loading ? 'Create Account' : 'Please wait.'}
                                disabled={auth.loading}
                            />
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
            )}
        </PageWrapper>
    );
}
