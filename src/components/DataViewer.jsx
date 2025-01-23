import React, { useState, useEffect, useCallback, useMemo} from 'react';
import { getColumnsCollection, getEntriesForTab, getProjectFields } from '../utils/firestore';
import TableTools from '../wrappers/TableTools';
import { Pagination } from './Pagination';
import { useAtom } from 'jotai';
import { currentProjectName, currentTableName, currentBatchSize } from '../utils/jotai';
import Button from './Button';
import WindowWrapper from '../wrappers/WindowWrapper';
import { Type, notify } from './Notifier';
import { deleteDoc, doc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import NewEntry from '../windows/NewEntry';
import InputLabel from '../components/InputLabel';
import { DropdownSelector } from '../components/FormFields';
import PageWrapper from '../wrappers/PageWrapper';
import TabBar from '../components/TabBar';

const STATIC_COLUMNS = [
    { id: 'actions', name: 'Actions', type: 'actions', order: -3 },
    { id: 'datetime', name: 'Date & Time', type: 'datetime', order: -2 }
];


const DataViewer = ({ Email, SelectedProject, SelectedTab }) => {
    // Existing state
    const [entries, setEntries] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [batchSize] = useAtom(currentBatchSize);
    const [currentProject, setCurrentProject] = useAtom(currentProjectName);
    const [currentTable, setCurrentTable] = useAtom(currentTableName);
    const [isAdminOrOwner, setIsAdminOrOwner] = useState(false);
    
    const [showEditWindow, setEditWindow] = useState(null);
    const [showManageColumns, setShowManageColumns] = useState(false);
    const [columnOrder, setColumnOrder] = useState({});
    const [columnsToDelete, setColumnsToDelete] = useState([]);
    const [editedColumnNames, setEditedColumnNames] = useState({});
    const getColumnClass = (columnName) => {
        const classMap = {
            'Date & Time': 'dateTimeColumn',
            'Site': 'siteColumn',
            'Year': 'yearColumn',
            'Taxa': 'taxaColumn',
            'Genus': 'genusColumn',
            'Species': 'speciesColumn'
        };
        return classMap[columnName] || '';
    };
   
 
    
    
const defaultColumns = useMemo(() => {
    return [
        { id: 'actions', name: 'Actions', type: 'actions', order: -3 },
        { id: 'datetime', name: 'Date & Time', type: 'datetime', order: -2 }
    ];
}, []);
    const fetchColumns = useCallback(async () => {
        if (!SelectedProject || !SelectedTab) return;
    
        try {
            const columnsData = await getColumnsCollection(SelectedProject, SelectedTab, Email);
            const sortedColumns = [...defaultColumns, ...columnsData].sort((a, b) => a.order - b.order);
            setColumns(sortedColumns);
            
            // Initialize all column properties
            const orderObj = {};
            const namesObj = {};
            const typesObj = {};
            const requiredObj = {};
            const identifierObj = {};
            const optionsObj = {};
    
            sortedColumns.forEach((col, index) => {
                orderObj[col.id] = index + 1;
                namesObj[col.id] = col.name;
                typesObj[col.id] = col.data_type || 'text';
                requiredObj[col.id] = col.required_field || false;
                identifierObj[col.id] = col.identifier_domain || false;
                optionsObj[col.id] = col.entry_options || [];
            });
    
            setColumnOrder(orderObj);
            setEditedColumnNames(namesObj);
            setEditedColumnTypes(typesObj);
            setEditedRequiredFields(requiredObj);
            setEditedIdentifierDomains(identifierObj);
            setEditedDropdownOptions(optionsObj);
        } catch (err) {
            console.error('Error fetching columns:', err);
            setError('Failed to load columns');
        }
    }, [SelectedProject, SelectedTab, Email, defaultColumns]);






   

    const handleColumnTypeChange = (columnId, newType) => {
        setEditedColumnTypes(prev => ({
            ...prev,
            [columnId]: newType
        }));
    };
    
    const handleRequiredFieldChange = (columnId, isRequired) => {
        setEditedRequiredFields(prev => ({
            ...prev,
            [columnId]: isRequired
        }));
    };
    
    const handleIdentifierDomainChange = (columnId, isIdentifier) => {
        setEditedIdentifierDomains(prev => ({
            ...prev,
            [columnId]: isIdentifier
        }));
    };
    
    const handleDropdownOptionsChange = (columnId, options) => {
        setEditedDropdownOptions(prev => ({
            ...prev,
            [columnId]: options
        }));
    };
    
    const handleAddDropdownOption = (columnId) => {
        const option = prompt('Enter new option:');
        if (option) {
            setEditedDropdownOptions(prev => ({
                ...prev,
                [columnId]: [...(prev[columnId] || []), option]
            }));
        }
    };
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

    
    useEffect(() => {
        let mounted = true;
        
        const loadData = async () => {
            setLoading(true);
            setError(null);
    
            try {
                if (!mounted) return;
                setCurrentProject(SelectedProject);
                setCurrentTable(SelectedTab);
    
                await Promise.all([fetchColumns(), fetchEntries()]);
            } catch (err) {
                if (mounted) {
                    console.error('Error loading data:', err);
                    setError('Failed to load data');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
    
        loadData();
    
        return () => {
            mounted = false;
        };
    }, [SelectedProject, SelectedTab, fetchColumns, fetchEntries]);

    // Existing sorting logic
    const handleSort = (columnName) => {
        setSortConfig((prev) => ({
            key: columnName,
            direction: prev.key === columnName && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // New column management handlers
    const handleColumnOrderChange = (columnId, newValue) => {
        if (newValue === 'DELETE') {
            setColumnsToDelete(prev => [...prev, columnId]);
        } else {
            setColumnOrder(prev => ({
                ...prev,
                [columnId]: parseInt(newValue)
            }));
            // Remove from delete list if it was there
            setColumnsToDelete(prev => prev.filter(id => id !== columnId));
        }
    };

    const handleColumnNameChange = (columnId, newName) => {
        setEditedColumnNames(prev => ({
            ...prev,
            [columnId]: newName
        }));
    };

    const handleSaveColumnChanges = async () => {
        if (columnsToDelete.length > 0) {
            const confirmed = window.confirm(
                'Warning: Deleting columns will permanently remove all data contained in those columns. Continue?'
            );
            if (!confirmed) return;
        }
    
        try {
            const batch = writeBatch(db);
            
            for (const column of columns) {
                if (columnsToDelete.includes(column.id)) {
                    // Delete column
                    const columnRef = doc(db, 'Projects', SelectedProject, 'Tabs', SelectedTab, 'Columns', column.id);
                    batch.delete(columnRef);
                    
                    // Update entries to remove deleted column
                    const entriesSnapshot = await getDocs(collection(db, 'Projects', SelectedProject, 'Tabs', SelectedTab, 'Entries'));
                    entriesSnapshot.docs.forEach(entryDoc => {
                        const entryRef = doc(db, 'Projects', SelectedProject, 'Tabs', SelectedTab, 'Entries', entryDoc.id);
                        const entryData = entryDoc.data();
                        delete entryData[column.name];
                        batch.update(entryRef, entryData);
                    });
                } else if (!['actions', 'datetime', 'identifier'].includes(column.id)) {
                    // Update column with all properties
                    const columnRef = doc(db, 'Projects', SelectedProject, 'Tabs', SelectedTab, 'Columns', column.id);
                    batch.update(columnRef, {
                        name: editedColumnNames[column.id],
                        order: columnOrder[column.id],
                        data_type: editedColumnTypes[column.id],
                        required_field: editedRequiredFields[column.id],
                        identifier_domain: editedIdentifierDomains[column.id],
                        entry_options: editedColumnTypes[column.id] === 'multple choice' ? 
                            editedDropdownOptions[column.id] : []
                    });
                }
            }
    
            await batch.commit();
            await fetchColumns();
            await fetchEntries();
            setShowManageColumns(false);
            notify(Type.success, 'Column changes saved successfully');
        } catch (error) {
            console.error('Error saving column changes:', error);
            notify(Type.error, 'Faild to save column changes');
        }
    };
    const handleEdit = async (entry) => {
        
        const editWindow = <NewEntry
            CloseNewEntry={() => {}}
            ProjectName={SelectedProject}
            TabName={SelectedTab}
            Email={Email}
            existingEntry={entry}
        />;
       // setEditWindow(editWindow);
    };
    
    const handleDelete = async (entryId) => {
        const confirmed = window.confirm('Are you sure you want to delete this entry?');
        if (!confirmed) return;
    
        try {
            await deleteDoc(doc(db, 'Projects', SelectedProject, 'Tabs', SelectedTab, 'Entries', entryId));
            await fetchEntries(); // Refresh entries
            notify(Type.success, 'Entry deleted successfully');
        } catch (error) {
            console.error('Error deleting entry:', error);
            notify(Type.error, 'Failed to delete entry');
        }
    };
    // Sort entries based on current sort configuration
    const sortedEntries = React.useMemo(() => {
        if (!sortConfig.key) return entries;

        return [...entries].sort((a, b) => {
            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';
            
            if (sortConfig.direction === 'asc') {
                return aValue.toString().localeCompare(bValue.toString());
            }
            return bValue.toString().localeCompare(aValue.toString());
        });
    }, [entries, sortConfig]);

    // Calculate pagination
    const paginatedEntries = React.useMemo(() => {
        const startIndex = (currentPage - 1) * batchSize;
        return sortedEntries.slice(startIndex, startIndex + batchSize);
    }, [sortedEntries, currentPage, batchSize]);

    // Column Management Modal Component
    const ManageColumnsModal = () => (
        <WindowWrapper
            header="Manage Columns"
            onLeftButton={() => setShowManageColumns(false)}
            onRightButton={handleSaveColumnChanges}
            leftButtonText="Cancel"
            rightButtonText="Save Changes"
        >
            <div className="flex flex-col space-y-4">
                {columns.map((column) => (
                    <div key={column.id} className="flex justify-between items-center p-2">
                        <input 
                            type="text" 
                            value={editedColumnNames[column.id]}
                            className="border rounded px-2 py-1"
                            onChange={(e) => handleColumnNameChange(column.id, e.target.value)}
                        />
                        <select 
                            value={columnsToDelete.includes(column.id) ? 'DELETE' : columnOrder[column.id]} 
                            onChange={(e) => handleColumnOrderChange(column.id, e.target.value)}
                            className="border rounded px-2 py-1"
                        >
                            {Array.from({ length: columns.length }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                ))}
            </div>
        </WindowWrapper>
    );
    useEffect(() => {
        const checkPermissions = async () => {
            if (!SelectedProject || !Email) {
                setIsAdminOrOwner(false);
                return;
            }
    
            try {
                const projectFields = await getProjectFields(SelectedProject, ['owners', 'admins']);
                if (!projectFields) {
                    console.log('No project fields found');
                    setIsAdminOrOwner(false);
                    return;
                }
    
                const isAdmin = projectFields.admins?.includes(Email) || false;
                const isOwner = projectFields.owners?.includes(Email) || false;
                setIsAdminOrOwner(isAdmin || isOwner);
            } catch (err) {
                console.error('Error checking permissions:', err);
                setIsAdminOrOwner(false);
            }
        };
        
        checkPermissions();
    }, [SelectedProject, Email]);
    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

    return (
        <div className="flex-grow bg-white dark:bg-neutral-950">
            <div className="flex flex-col">
                <TableTools className="px-5 py-3">
                    {isAdminOrOwner && (
                        <Button 
                            text="Manage Columns"
                            onClick={() => setShowManageColumns(true)}
                        />
                    )}
                    <Pagination
                        currentPage={currentPage} 
                        totalPages={Math.ceil(entries.length / batchSize)}
                        onPageChange={setCurrentPage}
                    />
                </TableTools>
     
                <div className="overflow-x-auto">
    <table className="w-full border-collapse">
        <thead>
            <tr className="bg-neutral-100 dark:bg-neutral-800">
                <th className="p-2 text-left border-b font-semibold w-32">Actions</th>
                <th className="dateTimeColumn p-2 text-left border-b font-semibold">Date & Time</th>
                {columns.filter(col => !['actions', 'datetime'].includes(col.id)).map((column) => (
                    <th
                        key={column.id}
                        className={`p-2 text-left border-b font-semibold cursor-pointer ${
                            column.type === 'identifier' ? 'min-w-[150px]' : ''
                        } ${getColumnClass(column.name)}`}
                        onClick={() => handleSort(column.name)}
                    >
                        {column.name}
                        {sortConfig.key === column.name && (
                            <span className="ml-1">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                        )}
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {paginatedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <td className="p-2 border-b w-32">
                        <div className="flex space-x-2">
                            <Button 
                                text="Edit"
                                onClick={() => handleEdit(entry)}
                            />
                            <Button 
                                text="Delete"
                                onClick={() => handleDelete(entry.id)}
                            />
                        </div>
                    </td>
                    <td className="dateTimeColumn p-2 border-b">
                        {entry.entry_data?.['Date & Time'] || 'N/A'}
                    </td>
                    {columns.filter(col => !['actions', 'datetime'].includes(col.id)).map((column) => (
                        <td 
                            key={`${entry.id}-${column.id}`} 
                            className={`p-2 border-b ${
                                column.type === 'identifier' ? 'min-w-[150px]' : ''
                            } ${getColumnClass(column.name)}`}
                        >
                            {entry.entry_data?.[column.name] || 'N/A'}
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
</div>
     
                {showManageColumns && isAdminOrOwner && (
                    <WindowWrapper
                        header="Manage Columns"
                        onLeftButton={() => setShowManageColumns(false)}
                        onRightButton={handleSaveColumnChanges}
                        leftButtonText="Cancel"
                        rightButtonText="Save Changes"
                    >
                        <div className="flex flex-col space-y-4">
                            {columns.filter(col => !['actions', 'datetime', 'identifier'].includes(col.id))
                                .map((column) => (
                                    <div key={column.id} className="flex flex-col space-y-2 p-2">
                                        <div className="flex items-center space-x-4">
                                            <input 
                                                type="text" 
                                                value={editedColumnNames[column.id]}
                                                className="flex-grow border rounded px-2 py-1"
                                                onChange={(e) => handleColumnNameChange(column.id, e.target.value)}
                                                placeholder="Column Name"
                                            />
                                            <select 
                                                value={editedColumnTypes[column.id]}
                                                className="w-40 border rounded px-2 py-1"
                                                onChange={(e) => handleColumnTypeChange(column.id, e.target.value)}
                                            >
                                                <option value="text">Text Entry</option>
                                                <option value="multiple choice">Multiple Choice</option>
                                            </select>
                                            <select 
                                                value={columnsToDelete.includes(column.id) ? 'DELETE' : columnOrder[column.id]}
                                                className="w-24 border rounded px-2 py-1"
                                                onChange={(e) => handleColumnOrderChange(column.id, e.target.value)}
                                            >
                                                {Array.from({ length: columns.length }, (_, i) => i + 1)
                                                    .map(num => (
                                                        <option key={num} value={num}>{num}</option>
                                                ))}
                                                <option value="DELETE">DELETE</option>
                                            </select>
                                        </div>
                                        
                                        <div className="flex items-center space-x-4 pl-4">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={editedRequiredFields[column.id]}
                                                    onChange={(e) => handleRequiredFieldChange(column.id, e.target.checked)}
                                                />
                                                <span>Required Field</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={editedIdentifierDomains[column.id]}
                                                    onChange={(e) => handleIdentifierDomainChange(column.id, e.target.checked)}
                                                />
                                                <span>Include in Entry ID Domain</span>
                                            </label>
                                        </div>
     
                                        {editedColumnTypes[column.id] === 'multiple choice' && (
                                            <div className="pl-4">
                                                <select
                                                    multiple
                                                    className="w-full border rounded px-2 py-1"
                                                    value={editedDropdownOptions[column.id] || []}
                                                    onChange={(e) => handleDropdownOptionsChange(column.id, 
                                                        Array.from(e.target.selectedOptions, option => option.value)
                                                    )}
                                                >
                                                    {(editedDropdownOptions[column.id] || []).map((option) => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Button
                                                    text="Add Option"
                                                    onClick={() => handleAddDropdownOption(column.id)}
                                                    className="mt-2"
                                                />
                                            </div>
                                        )}
                                    </div>
                            ))}
                        </div>
                    </WindowWrapper>
                )}
            </div>
        </div>
     );
};
export default DataViewer;