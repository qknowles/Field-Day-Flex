import { LizardIcon } from '../assets/icons';
import React, { useState } from 'react';
import Button from './Button';

export default function TopNav({ Email, SetEmail, SetAuthenticated }) {

    const [menuOpen, setMenuOpen] = useState(false); // Hamburger menu state

    const toggleMenu = () => setMenuOpen((prev) => !prev);

    return (
        <div className="px-5 bg-neutral-800 dark:bg-neutral-900 text-neutral-100 w-full shadow-md max-h-16">
            <nav className="py-2 flex justify-between">
                <ul className="flex items-center space-x-5">
                    {/* Hamburger Menu */}
                    <li className="relative">
                        <button
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                            className="p-2 focus:outline-none"
                        >
                            <div className="hamburger-line bg-white"></div>
                            <div className="hamburger-line bg-white"></div>
                            <div className="hamburger-line bg-white"></div>
                        </button>
                        {menuOpen && (
                            <div className="hamburger-menu bg-white text-black absolute mt-2 rounded-md shadow-lg p-2">
                                <ul>
                                    <li className="p-2 hover:bg-red-700 rounded">Option 1</li>
                                    <li className="p-2 hover:bg-red-700 rounded">Option 2</li>
                                    <li className="p-2 hover:bg-red-700 rounded">Option 3</li>
                                </ul>
                            </div>
                        )}
                    </li>
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
