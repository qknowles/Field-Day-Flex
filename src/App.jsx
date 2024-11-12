import React, { useState } from 'react';
import { Authenticator } from './utils/authenticator';
// import TablePage from './pages/TablePage';
import LoginPage from './pages/LoginPage';
import TopNav from './components/TopNav';
import { Notifier } from './components/Notifier';

const auth = new Authenticator();

function App() {
    const [authenticated, setAuthenticated] = useState(false);
    const [email, setEmail] = useState('');

    return (
        <div className="flex flex-col w-full min-h-screen text-neutral-800 dark:text-neutral-200 select-none">
            <Notifier />
            <TopNav auth={auth} setAuthenticated={setAuthenticated} />
            <div className="flex flex-grow">
                {authenticated ? (
                    <span>table page not implemented</span>// <TablePage auth ={auth} email={email}/>
                ) : (
                    <LoginPage auth={auth} setAuthenticated={setAuthenticated} setEmail={setEmail} />
                )}
            </div>
        </div>
    );
}

export default App;

