import { LizardIcon } from '../assets/icons';
import React from 'react';
import Button from './Button';

export default function TopNav({ Email, SetEmail, SetAuthenticated }) {
    return (
        <div className="px-5 bg-neutral-800 dark:bg-neutral-900 text-neutral-100 w-full shadow-md max-h-16">
            <nav className="py-2 flex justify-between">
                <ul className="flex items-center space-x-5">
                    <li>
                        <LizardIcon className="text-asu-maroon fill-current h-12 cursor-pointer" />
                    </li>
                    <li>
                        <p className="text-lg font-bold">
                            Field Day
                            <span style={{ fontFamily: '"Lucida Handwriting", cursive' }}>
                                {' '}
                                Flex
                            </span>
                        </p>
                    </li>
                </ul>
                <UserController email={Email} setEmail={SetEmail} setAuthenticated={SetAuthenticated} />
            </nav>
        </div>
    );
}

function UserController({ email, setEmail, setAuthenticated }) {
    return (
        email && (
            <div className="flex items-center space-x-5">
                <div>{email}</div>
                <Button
                    text="Logout"
                    onClick={() => {
                        setAuthenticated(false);
                        setEmail(false);
                    }}
                />
            </div>
        )
    );
}
