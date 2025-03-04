import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { getColumnsCollection, getEntriesForTab, getProjectFields, deleteEntry, getEntryDetails } from '../utils/firestore'; // Import deleteEntry
import { Pagination } from './Pagination';
import Button from './Button';
import WindowWrapper from '../wrappers/WindowWrapper';
import { Type, notify } from './Notifier';
import NewEntry from '../windows/NewEntry';
import { AiFillEdit, AiFillDelete } from 'react-icons/ai';
import { useAtom, useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName, currentBatchSize } from '../utils/jotai';
import { visibleColumnsAtom } from '../utils/jotai';
import { searchQueryAtom, filteredEntriesAtom } from './SearchBar';
import { filterEntriesBySearch, highlightSearchTerms } from '../utils/searchUtils';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';



const DataViewer = forwardRef((props, ref) => {

    const SelectedProject = useAtomValue(currentProjectName);
    const SelectedTab = useAtomValue(currentTableName);
    const Email = useAtomValue(currentUserEmail);

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
    const [currentTab] = useAtom(currentTableName);
    const [allEntries, setAllEntries] = useState([]); // Store all entries for search filtering
    const [searchQuery] = useAtom(searchQueryAtom); // Get the search query from the atom
    const [filteredEntries, setFilteredEntries] = useAtom(filteredEntriesAtom); // Store filtered entries

    const [showEditWindow, setEditWindow] = useState(null);
    const [showManageColumns, setShowManageColumns] = useState(false);
    const [columnOrder, setColumnOrder] = useState({});
    const [columnsToDelete, setColumnsToDelete] = useState([]);
    const [editedColumnNames, setEditedColumnNames] = useState({});

    const getColumnClass = (columnName) => {
        const classMap = {
            'Date & Time': 'dateTimeColumn',
            Site: 'siteColumn',
            Year: 'yearColumn',
            Taxa: 'taxaColumn',
            Genus: 'genusColumn',
            Species: 'speciesColumn',
        };
        return classMap[columnName] || '';
    };

    const [visibleColumns] = useAtom(visibleColumnsAtom);
    const [editedColumnTypes, setEditedColumnTypes] = useState({});
    const [editedRequiredFields, setEditedRequiredFields] = useState({});
    const [editedIdentifierDomains, setEditedIdentifierDomains] = useState({});
    const [editedDropdownOptions, setEditedDropdownOptions] = useState({});

    const defaultColumns = useMemo(() => {
        return [
            { id: 'actions', name: 'Actions', type: 'actions', order: -3 },
            { id: 'datetime', name: 'Date & Time', type: 'datetime', order: -2 },
        ];
    }, []);

    const renderCellContent = (entry, columnName) => {
        const value = entry.entry_data?.[columnName] || 'N/A';
        return highlightSearchTerms(value, searchQuery);
    };




    const fetchColumns = useCallback(async () => {
        if (!SelectedProject || !SelectedTab) return;

        try {
            const columnsData = await getColumnsCollection(SelectedProject, SelectedTab, Email);
            const sortedColumns = [...defaultColumns, ...columnsData].sort(
                (a, b) => a.order - b.order,
            );
            setColumns(sortedColumns);

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

    const fetchEntries = useCallback(async () => {
        if (!SelectedProject || !SelectedTab) return;

        try {
            const entriesData = await getEntriesForTab(SelectedProject, SelectedTab, Email);
            const filteredEntries = entriesData.filter(entry => !entry.deleted);

            const formattedEntries = filteredEntries.map((entry) => {
                const formattedData = { ...entry.entry_data };
                return {
                    ...entry,
                    entry_data: formattedData,
                    entry_date: entry.entry_date ? new Date(entry.entry_date) : null
                };
            });

            // Sort by date (newest first)
            formattedEntries.sort((a, b) => {
                if (!a.entry_date) return 1;
                if (!b.entry_date) return -1;
                return b.entry_date - a.entry_date;
            });

            setAllEntries(formattedEntries); // Store all entries
            setEntries(formattedEntries); // Set entries (will be filtered by search)
        } catch (err) {
            console.error('Error fetching entries:', err);
            setError('Failed to load entries');
        }
    }, [SelectedProject, SelectedTab, Email]);

    // Apply search filtering when searchQuery changes - ONLY ONCE
    useEffect(() => {
        if (allEntries.length > 0) {
            const filtered = filterEntriesBySearch(allEntries, searchQuery);
            setFilteredEntries(filtered);
            setEntries(filtered);
            // Reset to first page when search changes
            setCurrentPage(1);
        }
    }, [searchQuery, allEntries, setFilteredEntries, setCurrentPage]);

    useImperativeHandle(ref, () => ({
        fetchEntries,
        fetchColumns
    }));

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
    }, [SelectedProject, SelectedTab, fetchColumns, fetchEntries, setCurrentProject, setCurrentTable]);

    const sortedEntries = React.useMemo(() => {
        if (!sortConfig.key) return entries;

        return [...entries].sort((a, b) => {
            const aValue = a.entry_data[sortConfig.key] || '';
            const bValue = b.entry_data[sortConfig.key] || '';

            if (sortConfig.key === 'entry_date') {
                return sortConfig.direction === 'asc'
                    ? new Date(bValue) - new Date(aValue)
                    : new Date(aValue) - new Date(bValue);
            }

            if (sortConfig.direction === 'asc') {
                return aValue.toString().localeCompare(bValue.toString());
            }
            return bValue.toString().localeCompare(aValue.toString());
        });
    }, [entries, sortConfig]);

    const paginatedEntries = React.useMemo(() => {
        const startIndex = (currentPage - 1) * batchSize;
        return sortedEntries.slice(startIndex, startIndex + batchSize);
    }, [sortedEntries, currentPage, batchSize]);

    // Handlers
    const handleSort = (columnName) => {
        setSortConfig((prev) => ({
            key: columnName,
            direction: prev.key === columnName && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };
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



    // New column management handlers
    const handleColumnOrderChange = (columnId, newValue) => {
        if (newValue === 'DELETE') {
            setColumnsToDelete((prev) => [...prev, columnId]);
        } else {
            setColumnOrder((prev) => ({
                ...prev,
                [columnId]: parseInt(newValue),
            }));
            // Remove from delete list if it was there
            setColumnsToDelete((prev) => prev.filter((id) => id !== columnId));
        }
    };

    const handleColumnNameChange = (columnId, newName) => {
        setEditedColumnNames((prev) => ({
            ...prev,
            [columnId]: newName,
        }));
    };

    const handleSaveColumnChanges = async () => {
        if (columnsToDelete.length > 0) {
            const confirmed = window.confirm(
                'Warning: Deleting columns will permanently remove all data contained in those columns. Continue?',
            );
            if (!confirmed) return;
        }

        try {
            await saveColumnChanges(
                SelectedProject,
                SelectedTab,
                columns,
                columnsToDelete,
                editedColumnNames,
                columnOrder,
                editedColumnTypes,
                editedRequiredFields,
                editedIdentifierDomains,
                editedDropdownOptions
            );
            await fetchColumns();
            await fetchEntries();
            setShowManageColumns(false);
            notify(Type.success, 'Column changes saved successfully');
        } catch (error) {
            console.error('Error saving column changes:', error);
            notify(Type.error, 'Failed to save column changes');
        }
    };


    const handleEdit = async (entryId) => {
        try {
            const entryDetails = await getEntryDetails(Email, SelectedProject, SelectedTab, entryId);
            const editWindow = (
                <NewEntry
                    CloseNewEntry={() => setEditWindow(null)}
                    ProjectName={SelectedProject}
                    TabName={SelectedTab}
                    Email={Email}
                    existingEntry={entryDetails} // Pass the fetched entry details
                    onEntryUpdated={async () => {
                        await fetchEntries(); // Refresh entries after editing
                    }}
                />
            );
            setEditWindow(editWindow);
        } catch (error) {
            console.error('Error fetching entry details:', error);
            notify(Type.error, 'Failed to fetch entry details');
        }
    };

    const handleDelete = async (entryId) => {
        const confirmed = window.confirm('Are you sure you want to delete this entry?');
        if (!confirmed) return;

        try {
            await deleteEntry(Email, SelectedProject, SelectedTab, entryId);
            await fetchEntries(); // Refresh entries
            notify(Type.success, 'Entry deleted successfully');
        } catch (error) {
            console.error('Error deleting entry:', error);
            notify(Type.error, 'Failed to delete entry');
        }
    };

    useEffect(() => {
        const refreshColumnsListener = () => {
            console.log("Refreshing columns after update...");
            fetchColumns();
        };

        window.addEventListener("refreshColumns", refreshColumnsListener);

        return () => {
            window.removeEventListener("refreshColumns", refreshColumnsListener);
        };
    }, []);

    useEffect(() => {
        const checkPermissions = async () => {
            if (!SelectedProject || !Email) {
                setIsAdminOrOwner(false);
                return;
            }

            try {
                const projectFields = await getProjectFields(SelectedProject, ['owners', 'admins']);
                if (!projectFields) {
                    console.error('No project fields found');
                    setIsAdminOrOwner(false);
                    return;
                }
                const isAdmin = projectFields.admins?.includes(Email) || false;
                const isOwner = projectFields.owners?.includes(Email) || false;
                setIsAdminOrOwner(isAdmin || isOwner);
            } catch (err) {
                console.error('Error checking permissions:');
                setIsAdminOrOwner(false);
            }
        };

        checkPermissions();
    }, [SelectedProject, Email]);
    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

    const filteredColumns = columns.filter((col) => !['actions', 'datetime'].includes(col.id)); 
    const lastColumnIndex = filteredColumns.length - 1;
    
    return (
        <div className="flex-grow bg-white dark:bg-neutral-950">
            <div className="flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-neutral-100 dark:bg-neutral-800">
                                <th className="p-2 text-left border-b font-semibold w-32 column-border">
                                    Actions
                                </th>
                                
                                {columns
                                    .filter((col) => 
                                        !['actions', 'datetime'].includes(col.id) &&
                                        (visibleColumns[currentTab]?.[col.id] !== false)
                                    )
                                    .map((column, index) => {
                                        const isLastColumn = index === lastColumnIndex;
                                        return (
                                            <th 
                                                key={column.id} 
                                                className="p-2 text-left border-b font-semibold cursor-pointer column-border" 
                                                onClick={() => handleSort(column.name)}
                                            >
                                                <ResizableBox
                                                    width={isLastColumn ? 300 : Math.max(50, column.name.length * 10)}
                                                    height={30}
                                                    axis="x"
                                                    minConstraints={[isLastColumn ? 300 : Math.max(50, column.name.length * 10), 30]}
                                                    maxConstraints={[isLastColumn ? 300 : Math.max(300, column.name.length * 30), 30]}
                                                    className={`resizable-box ${isLastColumn ? 'no-grabber' : ''}`}
                                                >
                                                    <div className={`flex items-center ${column.type === 'identifier' ? 'min-w-[150px]' : ''} ${getColumnClass(column.name)}`}>
                                                        {column.name}
                                                        {sortConfig.key === column.name && (
                                                            <span className="ml-1">
                                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </ResizableBox>
                                            </th>
                                        );
                                    })}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEntries.map((entry) => (
                                <tr
                                    key={entry.id}
                                    className="hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    <td className="p-2 border-b w-32 column-border">
                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={() => handleEdit(entry.id)}
                                                icon={AiFillEdit}
                                                flexible={true}
                                                className={'flex items-center justify-center'}
                                            />
                                            <Button
                                                onClick={() => handleDelete(entry.id)}
                                                icon={AiFillDelete}
                                                flexible={true}
                                                className={'flex items-center justify-center'}
                                            />
                                        </div>
                                    </td>
                                    
                                    {columns
                                        .filter((col) => 
                                            !['actions', 'datetime'].includes(col.id) && 
                                            (visibleColumns[currentTab]?.[col.id] !== false)
                                        )
                                        .map((column, index) => (
                                            <td
                                                key={`${entry.id}-${column.id}`}
                                                className={`p-2 border-b text-left column-border ${
                                                    column.type === 'identifier' ? 'min-w-[150px]' : ''
                                                } ${getColumnClass(column.name)}`}
                                            >
                                                {renderCellContent(entry, column.name)}
                                            </td>
                                        ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {showEditWindow && (
                    <WindowWrapper
                        header="Edit Entry"
                        onLeftButton={() => setEditWindow(null)}
                        leftButtonText="Close"
                    >
                        {showEditWindow}
                    </WindowWrapper>
                )}
                <div className="px-5 py-3 flex items-center w-full">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(entries.length / batchSize)}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
});

export default DataViewer;


