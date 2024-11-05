import Button from './Button';
import React from 'react';

export default function LogoutButton({ auth, setAuthenticated }) {
    return (
        <Button
            text="Logout"
            disabled={auth.loading}
            onClick={() => {
                auth.logout();
                setAuthenticated(false);
            }}
        />
    );
}
