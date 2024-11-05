import {LizardIcon} from '../assets/icons';
import LogoutButton from './LogoutButton';
import UserImage from './UserImage';
import React from 'react';

/**
 *
 * @param auth Authenticator object.
 * @param title Title to be displayed on the left of the nav bar.
 * @returns
 */
export default function TopNav({ auth, setAuthenticated }) {

    return (
        <div className="px-5 bg-neutral-800 dark:bg-neutral-900 text-neutral-100 w-full shadow-md max-h-16">
            <nav className="py-2 flex justify-between">
                <ul className="flex items-center space-x-5">
                    <li>
                        <LizardIcon className="text-asu-maroon fill-current h-12 cursor-pointer" />
                    </li>
                    <li>
                        <p className="text-lg font-bold">Field Day
                        <span style={{ fontFamily: '"Lucida Handwriting", cursive' }}> Flex</span>
                        </p>
                    </li>
                </ul>
                <UserController user={auth.user} auth={auth} setAuthenticated={setAuthenticated} />
            </nav>
        </div>
    );
}

function UserController({ user, auth, setAuthenticated }) {
    return (
        user
        &&
        <div className='flex items-center space-x-5'>
            <div>{user.email}</div>
            <UserImage className="h-12" user={user} />
            <LogoutButton auth={auth} setAuthenticated={setAuthenticated} />
        </div>
    );
}
