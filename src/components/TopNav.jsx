import { LizardIcon } from '../assets/icons';
import React, { useState } from 'react';
import Button from './Button';
import AccountSettings from '../windows/AccountSettings.jsx';
import ProjectSettings from '../windows/ProjectSettings.jsx';
import { getCurrentProject } from '../pages/TablePage.jsx';

export default function TopNav({ Email, SetEmail, SetAuthenticated, HideMenu = false }) {
    const [menuOpen, setMenuOpen] = useState(false); // Hamburger menu state
    const [modalContent, setModalContent] = useState(null); // Modal content state

    const toggleMenu = () => setMenuOpen((prev) => !prev);

    // Function to handle button clicks and display modal with custom content
    const handleButtonClick = (content) => {
        setModalContent(content); // Set the content to be displayed in the modal
    };

    // Function to close modal
    const closeModal = () => {
        setModalContent(null);
    };

    return (
        <div className="px-5 bg-neutral-800 dark:bg-neutral-900 text-neutral-100 w-full shadow-md max-h-16">
            <nav className="py-2 flex justify-between">
                <ul className="flex items-center space-x-5">
                    {/* Hamburger Menu */}
                    {!HideMenu && (
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
                                <div className="hamburger-menu text-black absolute mt-2 rounded-md shadow-lg p-2 dark:bg-neutral-700">
                                    <ul>
                                        <button
                                            className="flex rounded-md p-1.5 text-white whitespace-nowrap bg-asu-maroon border-2 border-transparent items-center mb-2 w-full"
                                            onClick={() =>
                                                handleButtonClick(
                                                    <AccountSettings
                                                        emailProp={Email}
                                                        CloseAccountSettings={closeModal}
                                                    />,
                                                )
                                            }
                                        >
                                            Manage Account
                                        </button>
                                        <button
                                            className="flex rounded-md p-1.5 text-white whitespace-nowrap bg-asu-maroon border-2 border-transparent items-center mb-2 w-full"
                                            onClick={() => handleButtonClick(<Memberships />)}
                                        >
                                            Memberships
                                        </button>
                                        <button
                                            className="flex rounded-md p-1.5 text-white whitespace-nowrap bg-asu-maroon border-2 border-transparent items-center w-full"
                                            onClick={() => handleButtonClick(
                                                <ProjectSettings
                                                    projectNameProp = {getCurrentProject}
                                                    CloseProjectSettings= {closeModal}
                                                />)}
                                        >
                                            Manage Project
                                        </button>
                                    </ul>
                                </div>
                            )}
                        </li>
                    )}
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
                <UserController
                    email={Email}
                    setEmail={SetEmail}
                    setAuthenticated={SetAuthenticated}
                />
            </nav>

            {/* Modal */}
            {modalContent && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                    style={{ zIndex: 9999 }}>
                    <div className="bg-white dark:bg-neutral-700 text-black dark:text-white p-5 rounded-lg shadow-lg">
                        {modalContent} {/* Render the custom modal content */}
                        <button
                            onClick={closeModal}
                            className="flex rounded-md p-1.5 text-white whitespace-nowrap bg-asu-maroon border-2 border-transparent items-center mb-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function UserController({ email, setEmail, setAuthenticated }) {
    return (
        email && (
            <div className="flex items-center space-x-5">
                <div>{email}</div>
                <button
                    className="px-4 py-2 bg-maroon text-white rounded"
                    onClick={() => {
                        setAuthenticated(false);
                        setEmail(false);
                    }}
                >
                    Logout
                </button>
            </div>
        )
    );
}

function Memberships() {
    return <div>Memberships Content</div>;
}

function ManageProject() {
    return <div>Manage Project Content</div>;
}
