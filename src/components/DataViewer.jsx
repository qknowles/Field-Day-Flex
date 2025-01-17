import React, { useState, useEffect, useCallback } from 'react';
import { getColumnsCollection, getEntriesForTab, deleteEntry, updateColumns } from '../utils/firestore';
import TableTools from '../wrappers/TableTools';
import { Pagination } from './Pagination';
import { useAtom } from 'jotai';
import { currentProjectName, currentTableName, currentBatchSize } from '../utils/jotai';
import { Type, notify } from '../components/Notifier';
import NewEntry from '../windows/NewEntry';
import ColumnSelectorButton from './ColumnSelectorButton';
import ColumnManager from './ColumnManager';
import IdentifierHandler from './IdentifierHandler';

const DataViewer = ({ Email, SelectedProject, SelectedTab }) => {
    // State Management
    const [entries, setEntries] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [visibleColumns, setVisibleColumns] = useState(new Set());
    const [showEditEntry, setShowEditEntry] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [showColumnManager, setShowColumnManager] = useState(false);
    const [tabConfig, setTabConfig] = useState(null);
    const [isRemeasure, setIsRemeasure] = useState(false);
    
    const [batchSize] = useAtom(currentBatchSize);
    const [currentProject, setCurrentProject] = useAtom(currentProjectName);
    const [currentTable, setCurrentTable] = useAtom(currentTableName);

    // Fetch tab configuration including identifier settings
    const fetchTabConfig = useCallback(async () => {
        if (!SelectedProject || !SelectedTab) return;
        try {
            const config = await getTabConfiguration(SelectedProject, SelectedTab);
            setTabConfig(config);
        } catch (err) {
            console.error('Error fetching tab configuration:', err);
            setError('Failed to load tab configuration');
        }
    }, [SelectedProject, SelectedTab]);

    // Fetch columns data
    const fetchColumns = useCallback(async () => {
        if (!SelectedProject || !SelectedTab) return;
        
        try {
            const columnsData = await getColumnsCollection(SelectedProject, SelectedTab, Email);
            const sortedColumns = columnsData.sort((a, b) => a.order - b.order);
            setColumns(sortedColumns);
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
                
                await Promise.all([fetchTabConfig(), fetchColumns(), fetchEntries()]);
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
            setTabConfig(null);
        };
    }, [SelectedProject, SelectedTab, fetchColumns, fetchEntries, fetchTabConfig]);

    // Handle column updates
    const handleColumnUpdate = async (updatedColumns) => {
        try {
            await updateColumns(SelectedProject, SelectedTab, updatedColumns);
            await fetchColumns();
            notify(Type.success, 'Columns updated successfully');
        } catch (err) {
            console.error('Error updating columns:', err);
            notify(Type.error, 'Failed to update columns');
        }
    };

    // Handle column deletion
    const handleColumnDelete = async (columnId) => {
        try {
            const updatedColumns = columns.filter(col => col.id !== columnId);
            await updateColumns(SelectedProject, SelectedTab, updatedColumns);
            await fetchColumns();
            notify(Type.success, 'Column deleted successfully');
        } catch (err) {
            console.error('Error deleting column:', err);
            notify(Type.error, 'Failed to delete column');
        }
    };

    // Handle entry editing
    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setShowEditEntry(true);
        setIsRemeasure(!!entry.identifier); // Set remeasure if entry has identifier
    };

    // Handle entry deletion
    const handleDelete = async (entryId) => {
        try {
            await deleteEntry(SelectedProject, SelectedTab, entryId);
            notify(Type.success, 'Entry deleted successfully');
            fetchEntries();
        } catch (err) {
            console.error('Error deleting entry:', err);
            notify(Type.error, 'Failed to delete entry');
        }
    };

    // Handle identifier generation
    const handleIdentifierGenerate = (identifier) => {
        if (editingEntry) {
            setEditingEntry({ ...editingEntry, identifier });
        }
        notify(Type.success, `Generated identifier: ${identifier}`);
    };

    // Format cell value based on column type
    const formatCellValue = (value, columnType) => {
        if (!value) return 'N/A';
        
        switch (columnType) {
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'number':
                return Number(value).toLocaleString();
            default:
                return value.toString();
        }
    };

    // Memoized sorting
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
                <button
                    onClick={() => setShowColumnManager(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Manage Columns
                </button>
            </TableTools>
            
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 text-left border-b font-semibold">Actions</th>
                            {tabConfig?.generate_unique_identifier && (
                                <th className="p-2 text-left border-b font-semibold">Identifier</th>
                            )}
                            {columns.map((column) => (
                                visibleColumns.has(column.name) && (
                                    <th
                                        key={column.id}
                                        className="p-2 text-left border-b font-semibold cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleSort(column.name)}
                                    >
                                        {column.name}
                                        <span className="text-xs text-gray-500 ml-1">
                                            ({column.data_type})
                                        </span>
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
                                    <div className="flex space-x-2">
                                        <button 
                                            className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
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
                                        {tabConfig?.generate_unique_identifier && (
                                            <IdentifierHandler
                                                tabConfig={tabConfig}
                                                onIdentifierGenerate={handleIdentifierGenerate}
                                                onHistoryClick={() => {/* Implement history view */}}
                                                isRemeasure={isRemeasure}
                                            />
                                        )}
                                    </div>
                                </td>
                                {tabConfig?.generate_unique_identifier && (
                                    <td className="p-2 border-b">
                                        {entry.identifier || 'N/A'}
                                    </td>
                                )}
                                {columns.map((column) => (
                                    visibleColumns.has(column.name) && (
                                        <td key={`${entry.id}-${column.id}`} className="p-2 border-b">
                                            {formatCellValue(entry.entry_data?.[column.name], column.data_type)}
                                        </td>
                                    )
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Column Manager Modal */}
            {showColumnManager && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <ColumnManager
                        columns={columns}
                        onColumnUpdate={handleColumnUpdate}
                        onColumnDelete={handleColumnDelete}
                        onClose={() => setShowColumnManager(false)}
                    />
                </div>
            )}

            {/* Edit Entry Modal */}
            {showEditEntry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <NewEntry
                        CloseNewEntry={() => {
                            setShowEditEntry(false);
                            setEditingEntry(null);
                            setIsRemeasure(false);
                            fetchEntries();
                        }}
                        ProjectName={SelectedProject}
                        TabName={SelectedTab}
                        Email={Email}
                        editingEntry={editingEntry}
                        tabConfig={tabConfig}
                        isRemeasure={isRemeasure}
                    />
                </div>
            )}
        </div>
    );
};

export default DataViewer;