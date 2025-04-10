import { useAtom } from 'jotai';
import { BackArrowIcon, ForwardArrowIcon } from '../assets/icons';
import { currentBatchSize } from '../utils/jotai';
import { notify, Type } from './Notifier';
import React, { useState } from 'react';

export const Pagination = ({ loadNextBatch, loadPrevBatch, currentPage, totalPages, onPageChange }) => {
    const [batchSize, setBatchSize] = useAtom(currentBatchSize);
    const [showStartError, setShowStartError] = useState(false);
    const [showEndError, setShowEndError] = useState(false);

    // For DataViewer pagination
    if (currentPage !== undefined && totalPages !== undefined && onPageChange) {
        return (
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`p-1 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                    <BackArrowIcon />
                </button>
                
                <span className="text-sm">
                    Page {currentPage} of {Math.max(1, totalPages)}
                </span>
                
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className={`p-1 rounded ${currentPage >= totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                    <ForwardArrowIcon />
                </button>

                <div className="relative ml-4">
                    <select
                        onChange={(e) => setBatchSize(e.target.value.replace(' Rows', ''))}
                        value={`${batchSize} Rows`}
                        className="border rounded px-2 py-1 bg-white dark:bg-neutral-800"
                    >
                        <option>15 Rows</option>
                        <option>50 Rows</option>
                        <option>100 Rows</option>
                    </select>
                </div>
            </div>
        );
    }

    // Legacy pagination with loadNextBatch and loadPrevBatch
    return (
        <div className="w-full p-2 flex justify-end items-center">
            <div className="relative">
                {showStartError && (
                    <div className="absolute -top-10 left-0 bg-red-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                        No previous data to load
                    </div>
                )}
                <div
                    className={`cursor-pointer hover:scale-125 transition active:scale-100 text-xl ${showStartError ? 'text-red-500' : ''}`}
                    onClick={async () => {
                        if ((await loadPrevBatch()) === false) {
                            notify(Type.error, 'No more data to load');
                            setShowStartError(true);
                            setTimeout(() => setShowStartError(false), 1500);
                        }
                    }}
                >
                    <BackArrowIcon />
                </div>
            </div>

            <div className="relative p-2">
                <select
                    onChange={(e) => setBatchSize(e.target.value.replace(' Rows', ''))}
                    value={`${batchSize} Rows`}
                    className="border rounded px-2 py-1 bg-white dark:bg-neutral-800"
                >
                    <option>15 Rows</option>
                    <option>50 Rows</option>
                    <option>100 Rows</option>
                </select>
            </div>

            <div className="relative">
                {showEndError && (
                    <div className="absolute -top-10 right-0 bg-red-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                        No more data to load
                    </div>
                )}
                <div
                    className={`cursor-pointer hover:scale-125 transition active:scale-100 text-xl ${showEndError ? 'text-red-500' : ''}`}
                    onClick={async () => {
                        if ((await loadNextBatch()) === false) {
                            notify(Type.error, 'No more data to load');
                            setShowEndError(true);
                            setTimeout(() => setShowEndError(false), 1500);
                        }
                    }}
                >
                    <ForwardArrowIcon />
                </div>
            </div>
        </div>
    );
};