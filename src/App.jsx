import React, { useState } from 'react';
import TablePage from './pages/TablePage';
import HomePage from './pages/HomePage';
import TopNav from './components/TopNav';
import { Notifier } from './components/Notifier';
export let updateUserEmail = null;

function App() {
    const [authenticated, setAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    updateUserEmail = email => {
        setEmail(email);
    }

    return (
        <div className="flex flex-col w-full min-h-screen text-neutral-800 dark:text-neutral-200 select-none">
            <Notifier />
            <TopNav
                Email={email}
                SetEmail={setEmail}
                SetAuthenticated={setAuthenticated}
                Authenticated={authenticated}
            />
            <div className="flex flex-grow">
                {authenticated ? (
                    <TablePage Email={email} />
                ) : (
                    <HomePage SetAuthenticated={setAuthenticated} SetEmail={setEmail} />
                )}
            </div>
        </div>
    );
}

export default App;
