import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { currentProjectName } from '../utils/jotai';
import AccountSettings from '../windows/AccountSettings';
import ProjectSettings from '../windows/ProjectSettings';
import ManageMembership from '../windows/MembershipWindow';
import Button from './Button'; // Import Button component

export default function Hamburger({ Email }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [currentProject] = useAtom(currentProjectName);
    const [setCurrentWindow] = useState('HomePage');

    const toggleMenu = () => setMenuOpen((prev) => !prev);

    const handleButtonClick = (content) => {
        setModalContent(content);
    };

    const closeModal = () => {
        setModalContent(null);
        setMenuOpen(false);
    };

    return (
        <div className="relative">
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
                        <li className="mb-2">
                            <Button
                                text="Manage Account"
                                onClick={() =>
                                    handleButtonClick(
                                        <AccountSettings
                                            emailProp={Email}
                                            CloseAccountSettings={closeModal}
                                        />,
                                    )
                                }
                            />
                        </li>
                        <li className="mb-2">
                            <Button
                                text="Memberships"
                                onClick={() =>
                                    handleButtonClick(
                                        <ManageMembership
                                            Email={Email}
                                            CancelMemberships={closeModal}
                                            setCurrentWindow={setCurrentWindow}
                                        />,
                                    )
                                }
                            />
                        </li>
                        <li>
                            <Button
                                text="Manage Project"
                                onClick={() =>
                                    handleButtonClick(
                                        <ProjectSettings
                                            projectNameProp={currentProject}
                                            CloseProjectSettings={closeModal}
                                            emailProp={Email}
                                        />,
                                    )
                                }
                            />
                        </li>
                    </ul>
                </div>
            )}

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
