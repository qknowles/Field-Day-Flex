import React from 'react';
import TablePage from './pages/TablePage';
import HomePage from './pages/HomePage';
import TopNav from './components/TopNav';
import { Notifier } from './components/Notifier';
import { useAtomValue } from 'jotai';
import { isAuthenticated } from './utils/jotai.js';
import './index.css';
import { InfoIconProvider } from './components/InfoIconContext';

function App() {
    const authenticated = useAtomValue(isAuthenticated);
    
    return (
        <InfoIconProvider
            initialSettings={{
                iconColor: 'text-blue-500',
                tooltipColor: 'bg-neutral-800',
                textColor: 'text-white',
                defaultPosition: 'top',
                defaultSize: 16,
                defaultWidth: 200
            }}
        >
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
        </InfoIconProvider>
    );
}

export default App;