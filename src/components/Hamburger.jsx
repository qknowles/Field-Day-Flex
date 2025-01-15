import { LizardIcon } from '../assets/icons';
import React, { useState } from 'react';
import Button from './Button';
import AccountSettings from '../windows/AccountSettings.jsx';
import ProjectSettings from '../windows/ProjectSettings.jsx';
import { getCurrentProject } from '../pages/TablePage.jsx';
import { getDocumentIdByProjectName } from '../utils/firestore.js';
import ManageMembership from '../windows/MembershipWindow';

export default function Hamburger({ Email }) {
    const [menuOpen, setMenuOpen] = useState(false); // Hamburger menu state
    const [modalContent, setModalContent] = useState(null); // Modal content state
    const [setCurrentWindow] = useState('HomePage');

    const toggleMenu = () => setMenuOpen((prev) => !prev);

    // Function to handle button clicks and display modal with custom content
    const handleButtonClick = (content) => {
        setModalContent(content); // Set the content to be displayed in the modal
    };

    // Function to close modal
    const closeModal = () => {
        setModalContent(null);
        setMenuOpen(false);
    };

    return (
        <div>
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
                            <li>
                                <button
                                    className="flex rounded-md p-1.5 text-white whitespace-nowrap bg-asu-maroon border-2 border-transparent items-center mb-2 w-full"
                                    onClick={() =>
                                        handleButtonClick(
                                            <AccountSettings
                                                emailProp={Email}
                                                CloseAccountSettings={closeModal}
                                            />
                                        )
                                    }
                                >
                                    Manage Account
                                </button>
                            </li>
                            <li>
                                <button
                                    className="flex rounded-md p-1.5 text-white whitespace-nowrap bg-asu-maroon border-2 border-transparent items-center mb-2 w-full"
                                    onClick={() =>
                                        handleButtonClick(
                                            <ManageMembership
                                                Email={Email}
                                                CancelMemberships={closeModal}
                                                setCurrentWindow={setCurrentWindow}
                                            />
                                        )
                                    }
                                >
                                    Memberships
                                </button>
                            </li>
                            <li>
                                <button
                                    className="flex rounded-md p-1.5 text-white whitespace-nowrap bg-asu-maroon border-2 border-transparent items-center w-full"
                                    onClick={() =>
                                        handleButtonClick(
                                            <ProjectSettings
                                                projectNameProp={getCurrentProject()}
                                                CloseProjectSettings={closeModal}
                                            />
                                        )
                                    }
                                >
                                    Manage Project
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </li>

            {modalContent && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                    style={{ zIndex: 999 }}
                >
                    {modalContent}
                </div>
            )}
        </div>
    );
}
