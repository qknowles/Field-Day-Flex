import React from 'react';
import TablePage from './pages/TablePage';
import HomePage from './pages/HomePage';
import TopNav from './components/TopNav';
import { Notifier } from './components/Notifier';
import { useAtomValue } from 'jotai';
import { isAuthenticated } from './utils/jotai.js';

function App() {
    const authenticated = useAtomValue(isAuthenticated);

    return (
        <div className="flex flex-col w-full min-h-screen text-neutral-800 dark:text-neutral-200 select-none">
            <Notifier />
            <TopNav />
            <div className="flex flex-grow">
                {authenticated ? (
                    <TablePage />
                ) : (
                    <HomePage />
                )}
            </div>
        </div>
    );
}

export default App;
