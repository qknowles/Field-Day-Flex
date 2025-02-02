import React from 'react';

export default function ExportModal({ showModal, onCancel }) {
    if (!showModal) return null; 

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4 text-center">Export Placeholder</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    This is a placeholder for the Export Modal. 
                </p>
                <div className="flex justify-end">
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        onClick={onCancel}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
