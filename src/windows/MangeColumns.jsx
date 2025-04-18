import React, { useEffect, useState } from 'react';
import { RadioButtons, YesNoSelector, DropdownFlex } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import { Type, notify } from '../components/Notifier';
import { getColumnsCollection } from '../utils/firestore';
import Button from '../components/Button';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';
import { getDocumentIdByEmailAndProjectName } from '../utils/firestore';
import { useSetAtom } from 'jotai';
import { refreshColumnsAtom } from '../utils/jotai.js';
import { useAtom } from 'jotai'; 


export default function ManageColumns({ CloseManageColumns, triggerRefresh }) {

    const SelectedProject = useAtomValue(currentProjectName);
    const TabName = useAtomValue(currentTableName);
    const Email = useAtomValue(currentUserEmail);

    // Column data state
    const [columns, setColumns] = useState([]);
    const [editingColumn, setEditingColumn] = useState(null);
    const [columnOrder, setColumnOrder] = useState({});
    const [columnsToDelete, setColumnsToDelete] = useState([]);

    // Column properties state
    const [editedColumnNames, setEditedColumnNames] = useState({});
    const [editedColumnTypes, setEditedColumnTypes] = useState({});
    const [editedRequiredFields, setEditedRequiredFields] = useState({});
    const [editedIdentifierDomains, setEditedIdentifierDomains] = useState({});
    const [editedDropdownOptions, setEditedDropdownOptions] = useState({});
    const [tempEntryOptions, setTempEntryOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const entryTypeOptions = ['whole number', 'decimal number', 'text', 'date', 'multiple choice'];
    const refreshTrigger = useAtomValue(refreshColumnsAtom);
    const [editedAllowNegative, setEditedAllowNegative] = useState({});

    

    useEffect(() => {
        console.log('ManageColumns mounted with props:', { SelectedProject, TabName, Email });
        loadColumns();
    }, [SelectedProject, TabName, Email, refreshTrigger]);

    const loadColumns = async () => {
        try {
            setLoading(true);
            const columnsData = (await getColumnsCollection(SelectedProject, TabName, Email))
            .filter((col) => !col.deleted); 

    
            if (!columnsData || columnsData.length === 0) {
                notify(Type.error, 'No columns found');
                return;
            }
    
           
            columnsData.sort((a, b) => {
                const aOrder = typeof a.order === 'number' ? a.order : Infinity;
                const bOrder = typeof b.order === 'number' ? b.order : Infinity;
                return aOrder - bOrder;
            });
    
            const orderObj = {};
            const namesObj = {};
    
            columnsData.forEach((col, index) => {
                orderObj[col.id] = index + 1;  
                namesObj[col.id] = col.name || '';
                editedAllowNegative[col.id] = col.allow_negative === true;
            });
    
            setEditedAllowNegative(editedAllowNegative);
            setColumns(columnsData);
            setColumnOrder(orderObj);  
            setEditedColumnNames(namesObj);
    
        } catch (error) {
            console.error('Error loading columns:', error);
            notify(Type.error, 'Failed to load columns');
        } finally {
            setLoading(false);
        }
    };
    
    
    
    const handleColumnOrderChange = (columnId, newValue) => {
        if (newValue === 'DELETE') {
            setColumnsToDelete((prev) => [...prev, columnId]); 
            setColumnOrder((prev) => ({
                ...prev,
                [columnId]: 'DELETE' 
            }));
            return;
        }
    
        const newOrder = parseInt(newValue, 10);
    
        setColumnOrder((prev) => {
            const updatedOrder = { ...prev };
    
            const swappedColumnId = Object.keys(updatedOrder).find(
                (id) => updatedOrder[id] === newOrder && id !== columnId
            );
    
            if (swappedColumnId) {
                
                updatedOrder[swappedColumnId] = updatedOrder[columnId];
            }
    
            updatedOrder[columnId] = newOrder;
    
            return updatedOrder;
        });
    
        setColumnsToDelete((prev) => prev.filter((id) => id !== columnId));
    };

    const handleColumnNameChange = (columnId, newName) => {
        setEditedColumnNames((prev) => ({
            ...prev,
            [columnId]: newName,
        }));
    };

    const handleColumnTypeChange = (columnId, newType) => {
        setEditedColumnTypes((prev) => ({
            ...prev,
            [columnId]: newType,
        }));
        if (newType !== 'multiple choice') {
            setEditedDropdownOptions((prev) => ({
                ...prev,
                [columnId]: [],
            }));
        }
    };

    
    const handleRequiredFieldChange = (columnId, isRequired) => {
        setEditedRequiredFields((prev) => ({
            ...prev,
            [columnId]: isRequired,
        }));
    };

    const handleIdentifierDomainChange = (columnId, isIdentifier) => {
        setEditedIdentifierDomains((prev) => ({
            ...prev,
            [columnId]: isIdentifier,
        }));
    };

    const handleDropdownOptionsChange = (columnId) => {
        const filteredOptions = tempEntryOptions.filter((option) => option !== 'Add Here');
        setEditedDropdownOptions((prev) => ({
            ...prev,
            [columnId]: filteredOptions,
        }));
    };
    
    const handleSaveChanges = async () => {
        // Check for duplicate order numbers
        const orderValues = Object.values(columnOrder);
        const uniqueValues = new Set(orderValues);
    
        if (orderValues.length !== uniqueValues.size) {
            notify(Type.error, 'Select unique order identifiers for each column.');
            return; // Stop execution and prevent saving
        }
    
        try {
            console.log("Saving column changes:", columnOrder, editedColumnNames);
    
            const projectId = await getDocumentIdByEmailAndProjectName(Email, SelectedProject);
            if (!projectId) {
                console.error(`No project found with name: ${SelectedProject}`);
                return;
            }
    
            console.log(`Using Project ID: ${projectId}`);
    
            const batch = writeBatch(db);
            const columnsData = await getColumnsCollection(SelectedProject, TabName, Email);
    
            // Map Firestore column IDs
            const columnIdMap = columnsData.reduce((map, col) => {
                map[col.id] = col;
                return map;
            }, {});
    
            let updatesMade = false;
            let nameChanges = {}; // Track column name changes
            let deletionsMade = false; // Track column deletions
    
            for (const columnId of Object.keys(columnOrder)) {
                if (!columnIdMap[columnId]) {
                    console.error(`Column ID ${columnId} is missing in columnIdMap`, { columnOrder, columnIdMap });
                    notify(Type.error, `Column ID ${columnId} is not valid for this tab`);
                    return;
                }
            }
            
            for (const columnId in columnOrder) {
                if (columnIdMap[columnId]) {
                    if (columnOrder[columnId] === 'DELETE') {
                        const columnRef = doc(db, 'Projects', projectId, 'Tabs', TabName, 'Columns', columnId);
                        batch.update(columnRef, { deleted: true });
                        deletionsMade = true;
                        console.log(`Marked column ${columnId} for deletion`);
                    } else {
                        const oldName = columnIdMap[columnId].name;
                        const newName = editedColumnNames[columnId] || oldName;
                        const newType = editedColumnTypes[columnId] || columnIdMap[columnId].data_type;
    
                        if (oldName !== newName) {
                            nameChanges[oldName] = newName; // Store for entry updates
                        }
    
                        const columnRef = doc(db, 'Projects', projectId, 'Tabs', TabName, 'Columns', columnId);
                        batch.update(columnRef, {
                            order: columnOrder[columnId], // Update order
                            name: newName, // Update name
                            data_type: newType, //update type
                            required_field: editedRequiredFields[columnId] ?? false,
                            identifier_domain: editedIdentifierDomains[columnId] ?? false,
                            allow_negative: editedAllowNegative[columnId] ?? false, 
                            entry_options: newType === 'multiple choice' ? editedDropdownOptions[columnId] || [] : [],
                        });
    
                        updatesMade = true;
                    }
                } else {
                    console.error(`Firestore document with ID "${columnId}" does not exist`);
                }
            }
    
            if (updatesMade || deletionsMade) {
                await batch.commit();
                
                // Handle entry updates if column names changed
                if (Object.keys(nameChanges).length > 0) {
                    const entriesRef = collection(db, 'Projects', projectId, 'Tabs', TabName, 'Entries');
                    const entriesSnapshot = await getDocs(entriesRef);
            
                    const entriesBatch = writeBatch(db);
                    entriesSnapshot.forEach((entryDoc) => {
                        const entryRef = doc(db, 'Projects', projectId, 'Tabs', TabName, 'Entries', entryDoc.id);
                        const entryData = entryDoc.data().entry_data;
            
                        let updatedEntryData = { ...entryData };
                        let entryUpdated = false;
            
                        for (const oldName in nameChanges) {
                            if (oldName in updatedEntryData) {
                                const newName = nameChanges[oldName];
                                updatedEntryData[newName] = updatedEntryData[oldName]; // Move value
                                delete updatedEntryData[oldName]; // Remove old key
                                entryUpdated = true;
                            }
                        }
            
                        if (entryUpdated) {
                            entriesBatch.update(entryRef, { entry_data: updatedEntryData });
                        }
                    });
            
                    await entriesBatch.commit();
                }
    
                // Update columns state if deletions were made
                if (deletionsMade) {
                    setColumns((prev) => prev.filter((col) => columnOrder[col.id] !== 'DELETE'));
                }
                
                // Show a single combined success message based on what changed
                let successMessage = "";
                if (deletionsMade && Object.keys(nameChanges).length > 0) {
                    successMessage = "Columns updated: some columns renamed and some deleted.";
                } else if (deletionsMade) {
                    successMessage = "Selected columns deleted successfully.";
                } else if (Object.keys(nameChanges).length > 0) {
                    successMessage = "Column names updated successfully.";
                } else {
                    successMessage = "Column settings updated successfully.";
                }
                
                notify(Type.success, successMessage);
                CloseManageColumns();
                window.location.reload();
            }
        } catch (error) {
            console.error("Error updating columns:", error);
            notify(Type.error, 'Failed to update column order or names');
        }
    };
    
    useEffect(() => {
        const fetchColumns = async () => {
            try {
                const columnsData = await getColumnsCollection(SelectedProject, TabName, Email);
                setColumns(columnsData.sort((a, b) => a.order - b.order));
            } catch (error) {
                console.error("Error fetching columns:", error);
            }
        };
    
        fetchColumns();
    
        const handleRefresh = () => fetchColumns();
        window.addEventListener("refreshColumns", handleRefresh);
    
        return () => window.removeEventListener("refreshColumns", handleRefresh);
    }, [SelectedProject, TabName, Email]);
    
    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const entriesRef = collection(db, 'Projects', SelectedProject, 'Tabs', TabName, 'Entries');
                const entriesSnapshot = await getDocs(entriesRef);
    
                const entriesList = entriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
    
                setEntries(entriesList);
            } catch (error) {
                console.error("Error fetching entries:", error);
            }
        };
    
        fetchEntries();
    
        const handleRefresh = () => fetchEntries();
        window.addEventListener("refreshEntries", handleRefresh);
    
        return () => window.removeEventListener("refreshEntries", handleRefresh);
    }, [SelectedProject, TabName]);
    
    
    // Column editing modal reusing ColumnOptions functionality
    const ColumnEditModal = ({ column }) => (
        <WindowWrapper
            header={`Edit Column: ${editedColumnNames[column.id]}`}
            onLeftButton={() => setEditingColumn(null)}
            onRightButton={() => {
                if (editedColumnTypes[column.id] === 'multiple choice') {
                    handleDropdownOptionsChange(column.id);
                }
                setEditingColumn(null);
            }}
            leftButtonText="Cancel"
            rightButtonText="Done"
        >
            <div className="flex flex-col space-y-4 p-4">
                <RadioButtons
                    label="Data Entry Type"
                    options={entryTypeOptions}
                    selectedOption={editedColumnTypes[column.id]}
                    setSelectedOption={(type) => handleColumnTypeChange(column.id, type)}
                    layout="horizontal"
                />

                {editedColumnTypes[column.id] === 'multiple choice' && (
                    <DropdownFlex
                        options={tempEntryOptions}
                        setOptions={setTempEntryOptions}
                        label="Entry Choices"
                    />
                )}
                
                {(editedColumnTypes[column.id] === 'whole number' ||
                  editedColumnTypes[column.id] === 'decimal number') && (
                   <YesNoSelector
                        label="Allow Negative Values"
                        layout="horizontal-start"
                        selection={editedAllowNegative[column.id]}
                        setSelection={(value) =>
                            setEditedAllowNegative((prev) => ({
                                ...prev,
                                [column.id]: value,
                            }))
                        }
                   />
                )}


                <YesNoSelector
                    label="Required Field"
                    layout="horizontal-start"
                    selection={editedRequiredFields[column.id]}
                    setSelection={(value) => handleRequiredFieldChange(column.id, value)}
                />

                <YesNoSelector
                    label="Include in Entry ID Domain"
                    layout="horizontal-start"
                    selection={editedIdentifierDomains[column.id]}
                    setSelection={(value) => handleIdentifierDomainChange(column.id, value)}
                />
            </div>
        </WindowWrapper>
    );
    console.log('Current columns state:', {
        columns,
        editedColumnNames,
        editingColumn,
        columnOrder,
    });
    return (
        <>
            <WindowWrapper
                header="Manage Columns"
                onLeftButton={CloseManageColumns}
                onRightButton={handleSaveChanges}
                leftButtonText="Cancel"
                rightButtonText="Save Changes"
            >
                <div className="flex flex-col space-y-4 p-4">
    {loading ? (
        <div className="text-center">Loading columns...</div>
    ) : columns.length === 0 ? (
        <div className="text-center">No columns found</div>
    ) : (
        <>

           <div className="flex justify-between items-center px-4 py-1 mb-2 rounded bg-neutral-200 dark:bg-neutral-800">
              <div>
                  <label className="text-black dark:text-white text-sm font-semibold tracking-wide">
                      Column Name
                  </label>
              </div>
              <div className="pr-[50px]">
                  <label className="text-black dark:text-white text-sm font-semibold tracking-wide">
                      Column Order
                  </label>
                </div>
           </div>



            {/* Column Rows */}
            {columns.map((column) => (
                <div
                    key={column.id}
                    className="flex items-center space-x-4 p-2 bg-neutral-100 dark:bg-neutral-800 rounded"
                >
                    <input
                        type="text"
                        value={editedColumnNames[column.id] || ''}
                        onChange={(e) => handleColumnNameChange(column.id, e.target.value)}
                        className="flex-grow border rounded px-2 py-1 text-white"
                    />
                    <select
                        value={columnOrder[column.id] ?? (columns.findIndex(col => col.id === column.id) + 1)}
                        onChange={(e) => handleColumnOrderChange(column.id, e.target.value)}
                        className="border rounded px-2 py-1"
                    >
                        {Array.from({ length: columns.length }, (_, i) => i + 1).map((num) => (
    <option key={num} value={num}>
        {num}
    </option>
))}
<option key="delete" value="DELETE">DELETE</option>

                    </select>
                    <Button
                        text="Edit"
                        onClick={() => {
                            setTempEntryOptions(editedDropdownOptions[column.id] || []);
                            setEditingColumn(column);
                        }}
                    />
                </div>
            ))}
        </>
    )}
</div>

            </WindowWrapper>

            {editingColumn && <ColumnEditModal column={editingColumn} />}
        </>
    );
}