import React, { useState, useEffect, useCallback } from 'react';
import { getColumnsCollection, getEntriesForTab } from '../utils/firestore';
import TableTools from '../wrappers/TableTools';
import { Pagination } from './Pagination';
import { useAtom } from 'jotai';
import { currentProjectName, currentTableName, currentBatchSize } from '../utils/jotai';
import { Type, notify } from '../components/Notifier';
import NewEntry from '../windows/NewEntry';
import ColumnSelectorButton from './ColumnSelectorButton';

const DataViewer = ({ Email, SelectedProject, SelectedTab }) => {
    const [entries, setEntries] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [visibleColumns, setVisibleColumns] = useState(new Set());
    const [showEditEntry, setShowEditEntry] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    
    const [batchSize] = useAtom(currentBatchSize);
    const [currentProject, setCurrentProject] = useAtom(currentProjectName);
    const [currentTable, setCurrentTable] = useAtom(currentTableName);

    // Fetch columns data
    const fetchColumns = useCallback(async () => {
        if (!SelectedProject || !SelectedTab) return;
        
        try {
            const columnsData = await getColumnsCollection(SelectedProject, SelectedTab, Email);
            const sortedColumns = columnsData.sort((a, b) => a.order - b.order);
            setColumns(sortedColumns);
            // Initialize visible columns
            setVisibleColumns(new Set(sortedColumns.map(col => col.name)));
        } catch (err) {
            console.error('Error fetching columns:', err);
            setError('Failed to load columns');
        }
    }, [SelectedProject, SelectedTab, Email]);

    // Fetch entries data
    const fetchEntries = useCallback(async () => {
        if (!SelectedProject || !SelectedTab) return;

        try {
            const entriesData = await getEntriesForTab(SelectedProject, SelectedTab, Email);
            setEntries(entriesData);
        } catch (err) {
            console.error('Error fetching entries:', err);
            setError('Failed to load entries');
        }
    }, [SelectedProject, SelectedTab, Email]);

    // Initialize data loading
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                setCurrentProject(SelectedProject);
                setCurrentTable(SelectedTab);
                
                await Promise.all([fetchColumns(), fetchEntries()]);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
        
        return () => {
            setEntries([]);
            setColumns([]);
            setError(null);
        };
    }, [SelectedProject, SelectedTab, fetchColumns, fetchEntries, setCurrentProject, setCurrentTable]);

    // Handle column visibility toggle
    const toggleColumn = useCallback((columnName) => {
        setVisibleColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(columnName)) {
                newSet.delete(columnName);
            } else {
                newSet.add(columnName);
            }
            return newSet;
        });
    }, []);

    // Handle edit entry
    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setShowEditEntry(true);
    };

    // Handle delete entry
    const handleDelete = async (entryId) => {
        try {
            // Implement delete functionality using Firestore
            await deleteEntryFromFirestore(entryId);
            notify(Type.success, 'Entry deleted successfully');
            fetchEntries(); // Refresh the entries
        } catch (err) {
            console.error('Error deleting entry:', err);
            notify(Type.error, 'Failed to delete entry');
        }
    };

    // Sort entries based on configuration
    const sortedEntries = React.useMemo(() => {
        if (!sortConfig.key) return entries;
        
        return [...entries].sort((a, b) => {
            const aValue = a.entry_data?.[sortConfig.key] ?? '';
            const bValue = b.entry_data?.[sortConfig.key] ?? '';
            
            if (sortConfig.direction === 'asc') {
                return aValue.toString().localeCompare(bValue.toString());
            }
            return bValue.toString().localeCompare(aValue.toString());
        });
    }, [entries, sortConfig]);

    // Handle sorting
    const handleSort = (columnName) => {
        setSortConfig((prev) => ({
            key: columnName,
            direction: prev.key === columnName && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Handle pagination
    const paginatedEntries = React.useMemo(() => {
        const startIndex = (currentPage - 1) * batchSize;
        return sortedEntries.slice(startIndex, startIndex + batchSize);
    }, [sortedEntries, currentPage, batchSize]);

    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="p-4 text-center text-red-600">{error}</div>;
    if (!columns.length) return <div className="p-4 text-center">No columns defined for this tab.</div>;

    return (
        <div className="flex-grow overflow-auto">
            <TableTools>
                <Pagination 
                    currentPage={currentPage}
                    totalPages={Math.ceil(sortedEntries.length / batchSize)}
                    onPageChange={setCurrentPage}
                />
                <ColumnSelectorButton 
                    labels={columns.map(col => col.name)}
                    columns={visibleColumns}
                    toggleColumn={toggleColumn}
                />
            </TableTools>
            
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 text-left border-b font-semibold">Actions</th>
                            {columns.map((column) => (
                                visibleColumns.has(column.name) && (
                                    <th
                                        key={column.id}
                                        className="p-2 text-left border-b font-semibold cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleSort(column.name)}
                                    >
                                        {column.name}
                                        {sortConfig.key === column.name && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                )
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEntries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50">
                                <td className="p-2 border-b">
                                    <button 
                                        className="px-2 py-1 text-sm bg-blue-500 text-white rounded mr-2"
                                        onClick={() => handleEdit(entry)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="px-2 py-1 text-sm bg-red-500 text-white rounded"
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to delete this entry?')) {
                                                handleDelete(entry.id);
                                            }
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                                {columns.map((column) => (
                                    visibleColumns.has(column.name) && (
                                        <td key={`${entry.id}-${column.id}`} className="p-2 border-b">
                                            {entry.entry_data?.[column.name] ?? 'N/A'}
                                        </td>
                                    )
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showEditEntry && (
                <NewEntry
                    CloseNewEntry={() => {
                        setShowEditEntry(false);
                        setEditingEntry(null);
                        fetchEntries(); // Refresh entries after edit
                    }}
                    ProjectName={SelectedProject}
                    TabName={SelectedTab}
                    Email={Email}
                    editingEntry={editingEntry}
                />
            )}
        </div>
    );
};

export default DataViewer;