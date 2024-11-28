import React, { useState, useRef, useEffect } from 'react';
import { TableEntry } from './TableEntry';
import { TableHeading } from './TableHeading';
import { tableBody } from '../utils/variants';
import { usePagination } from '../utils/usePagination';
import { Pagination } from './Pagination';

export const Table = ({ Email, SelectedProject, SelectedTab }) => {
    const [sortedColumn, setSortedColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [columnWidths, setColumnWidths] = useState({});
    const [resizing, setResizing] = useState(null);
    const [entries, setEntries] = useState([]);
    const [columns, setColumns] = useState({});
    const [labels, setLabels] = useState([]);
    const tableRef = useRef(null);
    const startXRef = useRef(null);
    const startWidthRef = useRef(null);

    const { loadBatch, loadNextBatch, loadPreviousBatch } = usePagination((newEntries) => {
        setEntries(newEntries);
    });

    useEffect(() => {
        if (SelectedProject && SelectedTab) {
            loadBatch();
        }
    }, [SelectedProject, SelectedTab]);

    const calculateColumnWidths = () => {
        if (!tableRef.current) return;
        const measureDiv = document.createElement('div');
        measureDiv.style.position = 'absolute';
        measureDiv.style.visibility = 'hidden';
        measureDiv.style.whiteSpace = 'nowrap';
        document.body.appendChild(measureDiv);

        const newWidths = {};
        newWidths['actions'] = 60;

        labels.forEach((label, index) => {
            if (columns[label]?.show) {
                measureDiv.textContent = label;
                let maxWidth = measureDiv.offsetWidth + 12;

                entries.forEach(entry => {
                    const value = entry.data?.()[label] || 'N/A';
                    measureDiv.textContent = String(value);
                    const contentWidth = measureDiv.offsetWidth + 34;
                    maxWidth = Math.max(maxWidth, contentWidth);
                });

                newWidths[index] = Math.min(Math.max(maxWidth, 20), 400);
            }
        });

        document.body.removeChild(measureDiv);
        return newWidths;
    };

    useEffect(() => {
        const initialWidths = calculateColumnWidths();
        setColumnWidths(initialWidths);
    }, [entries, labels, columns]);

    const startResizing = (e, columnIndex) => {
        setResizing(columnIndex);
        startXRef.current = e.clientX;
        startWidthRef.current = columnWidths[columnIndex] || (columnIndex === 'actions' ? 50 : 80);
        e.preventDefault();
        e.stopPropagation();
    };

    const handleMouseMove = (e) => {
        if (resizing === null) return;
        const currentWidth = startWidthRef.current;
        const mouseMove = e.clientX - startXRef.current;
        const newWidth = Math.max(20, currentWidth + mouseMove);
        
        requestAnimationFrame(() => {
            setColumnWidths(prev => ({
                ...prev,
                [resizing]: Math.min(newWidth, 400)
            }));
        });
    };

    const stopResizing = () => {
        setResizing(null);
        startXRef.current = null;
        startWidthRef.current = null;
    };

    useEffect(() => {
        if (resizing !== null) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', stopResizing);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', stopResizing);
            };
        }
    }, [resizing]);

    const resetColumnWidths = () => {
        const initialWidths = calculateColumnWidths();
        setColumnWidths(initialWidths);
    };

    return (
        <>
            <div className="w-full overflow-x-auto relative border-b border-neutral-400">
                <div className="flex justify-end mb-1">
                    <button
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-300 transition-colors"
                        onClick={resetColumnWidths}
                    >
                        Reset Columns
                    </button>
                </div>
                <div className="min-w-full inline-block">
                    <table 
                        ref={tableRef}
                        className="w-full table-auto border-collapse"
                        style={{ tableLayout: 'fixed', borderSpacing: 0 }}
                    >
                        <thead>
                            <tr className="border-b border-neutral-200">
                                <th className="relative font-semibold text-gray-600 text-center"
                                    style={{ 
                                        width: columnWidths['actions'] || 60,
                                        minWidth: 20,
                                        position: 'relative',
                                        padding: '4px 2px'
                                    }}
                                >
                                    Actions
                                    <div
                                        className="absolute top-0 h-full cursor-col-resize hover:bg-blue-400 z-10"
                                        style={{ 
                                            right: '-1px',
                                            width: '2px',
                                            transform: 'translateX(50%)'
                                        }}
                                        onMouseDown={(e) => startResizing(e, 'actions')}
                                    />
                                </th>
                                {labels.map((label, index) => 
                                    columns[label]?.show && (
                                        <th 
                                            key={label}
                                            className="relative border-l border-neutral-200"
                                            style={{ 
                                                width: columnWidths[index] || 60,
                                                minWidth: 20,
                                                position: 'relative',
                                                padding: '4px 2px'
                                            }}
                                        >
                                            <TableHeading
                                                label={label}
                                                active={sortedColumn === label}
                                                sortDirection={sortDirection}
                                                onClick={() => {
                                                    setSortedColumn(label);
                                                    setSortDirection(curr => curr === 'asc' ? 'desc' : 'asc');
                                                }}
                                            />
                                            <div
                                                className="absolute top-0 h-full cursor-col-resize hover:bg-red-800/50 z-10"
                                                style={{ 
                                                    right: '-1px',
                                                    width: '6px',
                                                    transform: 'translateX(50%)'
                                                }}
                                                onMouseDown={(e) => startResizing(e, index)}
                                            />
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, index) => (
                                <TableEntry
                                    key={entry.id}
                                    index={index}
                                    entrySnapshot={entry}
                                    shownColumns={labels.filter(label => columns[label]?.show)}
                                    removeEntry={() => {
                                        setEntries(entries.filter(e => e !== entry));
                                    }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Pagination
                loadNextBatch={loadNextBatch}
                loadPrevBatch={loadPreviousBatch}
            />
        </>
    );
};

export default Table;