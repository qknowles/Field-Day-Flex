import React, { useState } from 'react';
import { Authenticator } from './utils/authenticator';
import TablePage from './pages/TablePage';
import HomePage from './pages/HomePage';
import TopNav from './components/TopNav';
import { Notifier } from './components/Notifier';

const auth = new Authenticator();

function App() {
    const [authenticated, setAuthenticated] = useState(false);
    const [email, setEmail] = useState('');

    return (
        <div className="flex flex-col w-full min-h-screen text-neutral-800 dark:text-neutral-200 select-none">
            <Notifier />
            <TopNav email={email} setEmail={setEmail} setAuthenticated={setAuthenticated} />
            <div className="flex flex-grow">
                {authenticated ? (
                    <TablePage email={email}/>
                ) : (
                    <HomePage setAuthenticated={setAuthenticated} setEmail={setEmail} />
                )}
            </div>
        </div>
    );
}

export default App;

