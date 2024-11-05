import React, { useState } from 'react';
import { Authenticator } from './utils/authenticator';
// import TablePage from './pages/TablePage';
import LoginPage from './pages/LoginPage';
import TopNav from './components/TopNav';

const auth = new Authenticator();

function App() {
    const [authenticated, setAuthenticated] = useState(false);

    return (
        <div className="flex flex-col w-full min-h-screen text-neutral-800 dark:text-neutral-200 select-none">
            <TopNav auth={auth} setAuthenticated={setAuthenticated} />
            <div className="flex flex-grow">
                {authenticated ? (
                    <span>table page not implemented</span>// <TablePage auth ={auth} setAuthenticated={setAuthenticated}/>
                ) : (
                    <LoginPage auth={auth} setAuthenticated={setAuthenticated} />
                )}
            </div>
        </div>
    );
}

export default App;

