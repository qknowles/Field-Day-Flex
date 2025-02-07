import { LizardIcon } from '../assets/icons';
import React from 'react';
import Button from './Button';
import Hamburger from './Hamburger';
import { useAtomValue, useSetAtom } from 'jotai';
import { 
    currentUserEmail, 
    isAuthenticated, 
    clearLocalStorage,
    currentTableName,
    allTableNames,
    currentProjectName,
    allProjectNames,
    currentBatchSize
} from '../utils/jotai.js';

export default function TopNav() {
    const authenticated = useAtomValue(isAuthenticated);

    return (
        <div className="px-5 bg-neutral-800 dark:bg-neutral-900 text-neutral-100 w-full shadow-md max-h-16">
            <nav className="py-2 flex justify-between">
                <ul className="flex items-center space-x-5">
                    {authenticated && (
                        <li>
                            <Hamburger />
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
                <UserController />
            </nav>
        </div>
    );
}

function UserController() {
    const email = useAtomValue(currentUserEmail);
    
    const setUserEmail = useSetAtom(currentUserEmail);
    const setIsAuthenticated = useSetAtom(isAuthenticated);
    const setTableName = useSetAtom(currentTableName);
    const setAllTableNames = useSetAtom(allTableNames);
    const setProjectName = useSetAtom(currentProjectName);
    const setAllProjectNames = useSetAtom(allProjectNames);
    const setBatchSize = useSetAtom(currentBatchSize);

    const logout = () => {
        clearLocalStorage({
            setUserEmail,
            setIsAuthenticated,
            setTableName,
            setAllTableNames,
            setProjectName,
            setAllProjectNames,
            setBatchSize,
        });
    };

    return (
        email && (
            <div className="flex items-center space-x-5">
                <div>{email}</div>
                <Button text="Logout" onClick={logout} />
            </div>
        )
    );
}
