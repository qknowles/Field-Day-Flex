import React from 'react';

export default function PageWrapper({ children }) {
    return (
        <div className="w-full text-center overflow-auto flex flex-col min-h-screen">
            {children}
        </div>
    );
}