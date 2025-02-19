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




export default function ManageColumns({ CloseManageColumns }) {

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
    const entryTypeOptions = ['number', 'text', 'date', 'multiple choice'];
    const tabRef = collection(db, 'Projects', SelectedProject, 'Tabs', TabName, 'Columns');
    const columnsRef = collection(db, 'Projects', SelectedProject, 'Tabs', TabName, 'Columns');
   

    useEffect(() => {
        console.log('ManageColumns mounted with props:', { SelectedProject, TabName, Email });
        loadColumns();
    }, [SelectedProject, TabName, Email]);

    const loadColumns = async () => {
        try {
            setLoading(true);
            const columnsData = await getColumnsCollection(SelectedProject, TabName, Email);
    
            if (!columnsData || columnsData.length === 0) {
                notify(Type.error, 'No columns found');
                return;
            }
    
            // 🔹 Ensure all order values are unique and sequential
            const orderCounts = new Map(); // Tracks how many times an order is used
            const assignedOrders = new Set(); // Prevent duplicate orders
    
            columnsData.forEach((col) => {
                let order = col.order;
    
                // If order is missing, zero, or duplicated, assign a new one
                if (!order || order < 1 || orderCounts.get(order) > 0) {
                    order = assignedOrders.size + 1;
                }
    
                assignedOrders.add(order);
                orderCounts.set(order, (orderCounts.get(order) || 0) + 1);
                col.order = order; // Update column order
            });
    
            // 🔹 Sort columns based on order
            columnsData.sort((a, b) => a.order - b.order);
    
            setColumns(columnsData);
    
            // 🔹 Initialize column order state
            const orderObj = {};
            const namesObj = {};
    
            columnsData.forEach((col) => {
                orderObj[col.id] = col.order;
                namesObj[col.id] = col.name || ""; 
            });
    
            setColumnOrder(orderObj);
            setEditedColumnNames(namesObj);
    
            console.log(" Fixed Column Order State:", orderObj);
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
        } else {
            setColumnOrder((prev) => ({
                ...prev,
                [columnId]: parseInt(newValue) || 1, // Ensure default value
            }));
            setColumnsToDelete((prev) => prev.filter((id) => id !== columnId));
        }
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
            console.log(" Saving column changes:", columnOrder, editedColumnNames);
    
            const projectId = await getDocumentIdByEmailAndProjectName(Email, SelectedProject);
            if (!projectId) {
                console.error(` No project found with name: ${SelectedProject}`);
                return;
            }
    
            console.log(` Using Project ID: ${projectId}`);
    
            const batch = writeBatch(db);
            const columnsData = await getColumnsCollection(SelectedProject, TabName, Email);
    
            // Map Firestore column IDs
            const columnIdMap = columnsData.reduce((map, col) => {
                map[col.id] = col;
                return map;
            }, {});
    
            console.log("Firestore Column ID Map:", columnIdMap);
    
            let updatesMade = false;
            let nameChanges = {}; // Track column name changes
    
            for (const columnId in columnOrder) {
                if (columnIdMap[columnId]) {
                    const oldName = columnIdMap[columnId].name;
                    const newName = editedColumnNames[columnId] || oldName;
    
                    if (oldName !== newName) {
                        nameChanges[oldName] = newName; // Store for entry updates
                    }
    
                    const columnRef = doc(db, 'Projects', projectId, 'Tabs', TabName, 'Columns', columnId);
                    batch.update(columnRef, {
                        order: columnOrder[columnId], // Update order
                        name: newName, // Update name
                    });
    
                    updatesMade = true;
                } else {
                    console.error(` Firestore document with ID "${columnId}" does not exist`);
                }
            }
    
            if (updatesMade) {
                await batch.commit();
                console.log(" Firestore batch update committed successfully.");
                notify(Type.success, 'Column order and names updated successfully');

                // Update Entries Collection for Renamed Columns
                if (Object.keys(nameChanges).length > 0) {
                    console.log("🔄 Updating Entry Data for Column Renames:", nameChanges);
            
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
                    console.log("Entries updated successfully.");
                    notify(Type.success, "Entries updated with new column names.");
                }
            
                CloseManageColumns();
            }
          
            
        } catch (error) {
            console.error(" Error updating columns:", error);
            notify(Type.error, 'Failed to update column order or names');
        }
    };

    useEffect(() => {
        const fetchColumns = async () => {
            try {
                const columnsData = await getColumnsCollection(SelectedProject, TabName, Email);
                setColumns(columnsData);
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
                        columns.map((column) => (
                            <div
                                key={column.id}
                                className="flex items-center space-x-4 p-2 bg-neutral-100 dark:bg-neutral-800 rounded"
                            >
                                <input
                                 type="text"
                                 value={editedColumnNames[column.id] || ''} // Ensure empty string instead of undefined
                                 onChange={(e) => handleColumnNameChange(column.id, e.target.value)}
                                 className="flex-grow border rounded px-2 py-1 text-white"
                                />
                            <select
                                 value={columnOrder[column.id] ?? column.order} // Use Firestore order if available
                                 onChange={(e) => handleColumnOrderChange(column.id, e.target.value)}
                                 className="border rounded px-2 py-1"
                                >
                            {Array.from({ length: columns.length }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                       ))}
                   <option value="DELETE">DELETE</option>
                           </select>
                                <Button
                                    text="Edit"
                                    onClick={() => {
                                        setTempEntryOptions(editedDropdownOptions[column.id] || []);
                                        setEditingColumn(column);
                                    }}
                                />
                            </div>
                        ))
                    )}
                </div>
            </WindowWrapper>

            {editingColumn && <ColumnEditModal column={editingColumn} />}
        </>
    );
}
