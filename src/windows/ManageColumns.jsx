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
import { entryTypeOptions } from '../utils/globals.js';
import InfoIcon from '../components/InfoIcon';

export default function ManageColumns({ CloseManageColumns, triggerRefresh }) {
    const SelectedProject = useAtomValue(currentProjectName);
    const TabName = useAtomValue(currentTableName);
    const Email = useAtomValue(currentUserEmail);

    // Column data state
    const [columns, setColumns] = useState([]);
    const [editingColumn, setEditingColumn] = useState(null);
    const [columnOrder, setColumnOrder] = useState({});
    const [columnsToDelete, setColumnsToDelete] = useState([]);
    const [initialColumnState, setInitialColumnState] = useState({});

    // Column properties state
    const [editedColumnNames, setEditedColumnNames] = useState({});
    const [editedColumnTypes, setEditedColumnTypes] = useState({});
    const [editedRequiredFields, setEditedRequiredFields] = useState({});
    const [editedIdentifierDomains, setEditedIdentifierDomains] = useState({});
    const [editedDropdownOptions, setEditedDropdownOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refreshTrigger = useSetAtom(refreshColumnsAtom);
    const [editedAllowNegative, setEditedAllowNegative] = useState({});

    useEffect(() => {
        console.log('ManageColumns mounted with props:', { SelectedProject, TabName, Email });
        loadColumns();
    }, [SelectedProject, TabName, Email, refreshTrigger]);

    const loadColumns = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const columnsData = await getColumnsCollection(SelectedProject, TabName, Email);
            
            if (!columnsData || columnsData.length === 0) {
                setError('No columns found');
                setColumns([]);
                return;
            }

            const filteredColumns = columnsData.filter((col) => !col.deleted);
            
            if (filteredColumns.length === 0) {
                setError('No columns found');
                setColumns([]);
                return;
            }

            filteredColumns.sort((a, b) => {
                const aOrder = typeof a.order === 'number' ? a.order : Infinity;
                const bOrder = typeof b.order === 'number' ? b.order : Infinity;
                return aOrder - bOrder;
            });

            const orderObj = {};
            const namesObj = {};
            const typesObj = {};
            const requiredObj = {};
            const identifierObj = {};
            const allowNegativeObj = {};
            const optionsObj = {};

            filteredColumns.forEach((col, index) => {
                orderObj[col.id] = typeof col.order === 'number' ? col.order : index + 1;
                namesObj[col.id] = col.name || '';
                typesObj[col.id] = col.data_type || '';
                requiredObj[col.id] = col.required_field === true;
                identifierObj[col.id] = col.identifier_domain === true;
                allowNegativeObj[col.id] = col.allow_negative === true;
                optionsObj[col.id] = col.entry_options || [];
            });

            setColumns(filteredColumns);
            setColumnOrder(orderObj);
            setEditedColumnNames(namesObj);
            setEditedColumnTypes(typesObj);
            setEditedRequiredFields(requiredObj);
            setEditedIdentifierDomains(identifierObj);
            setEditedAllowNegative(allowNegativeObj);
            setEditedDropdownOptions(optionsObj);

            // Store initial state for change detection
            setInitialColumnState({
                names: {...namesObj},
                types: {...typesObj},
                required: {...requiredObj},
                identifier: {...identifierObj},
                allowNegative: {...allowNegativeObj},
                options: JSON.parse(JSON.stringify(optionsObj)),
                order: {...orderObj}
            });

        } catch (error) {
            console.error('Error loading columns:', error);
            setError('Failed to load columns');
            setColumns([]);
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
        // Don't clear dropdown options to avoid validation errors when switching to multiple choice
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

    // Check if any changes have been made
    const hasChanges = () => {
        // Check for columns to delete
        if (columnsToDelete.length > 0) return true;
        
        // Check for order changes
        for (const id in columnOrder) {
            if (columnOrder[id] !== initialColumnState.order[id]) return true;
        }
        
        // Check for name changes
        for (const id in editedColumnNames) {
            if (editedColumnNames[id] !== initialColumnState.names[id]) return true;
        }
        
        // Check for type changes
        for (const id in editedColumnTypes) {
            if (editedColumnTypes[id] !== initialColumnState.types[id]) return true;
        }
        
        // Check for required field changes
        for (const id in editedRequiredFields) {
            if (editedRequiredFields[id] !== initialColumnState.required[id]) return true;
        }
        
        // Check for identifier domain changes
        for (const id in editedIdentifierDomains) {
            if (editedIdentifierDomains[id] !== initialColumnState.identifier[id]) return true;
        }
        
        // Check for allow negative changes
        for (const id in editedAllowNegative) {
            if (editedAllowNegative[id] !== initialColumnState.allowNegative[id]) return true;
        }
        
        // Check for dropdown option changes
        for (const id in editedDropdownOptions) {
            const initialOptions = initialColumnState.options[id] || [];
            const currentOptions = editedDropdownOptions[id] || [];
            
            if (initialOptions.length !== currentOptions.length) return true;
            
            for (let i = 0; i < initialOptions.length; i++) {
                if (initialOptions[i] !== currentOptions[i]) return true;
            }
        }
        
        return false;
    };

    const validateEntryOptions = (columnId) => {
        // Only validate if the column is of type multiple choice
        if (editedColumnTypes[columnId] !== entryTypeOptions.MULTIPLE_CHOICE) return true;
        
        const options = editedDropdownOptions[columnId] || [];
        
        // Filter out empty options and "Add Here"
        const filteredOptions = options.filter(opt => opt && opt.trim() !== '' && opt !== 'Add Here');
        
        if (filteredOptions.length < 2) {
            notify(Type.error, `Multiple choice column "${editedColumnNames[columnId]}" must have at least 2 options`);
            return false;
        }
        
        // Check for uniqueness of options
        const uniqueOptions = new Set(filteredOptions);
        if (uniqueOptions.size < filteredOptions.length) {
            notify(Type.error, 'Each option must be unique');
            return false;
        }
        
        // Check option length limits (same as in ColumnOptions)
        const ENTRY_OPTION_MAX_LENGTH = 50; // Same as in fieldConstraints.js
        for (const option of filteredOptions) {
            if (option.length > ENTRY_OPTION_MAX_LENGTH) {
                notify(Type.error, `Option "${option}" exceeds maximum length of ${ENTRY_OPTION_MAX_LENGTH} characters.`);
                return false;
            }
        }
        
        return true;
    };

    const handleSaveChanges = async () => {
        // Check if any changes have been made
        if (!hasChanges()) {
            notify(Type.error, 'Nothing to update.');
            return;
        }

        // Check for duplicate order numbers
        const orderValues = Object.values(columnOrder).filter(val => val !== 'DELETE');
        const uniqueValues = new Set(orderValues);

        if (orderValues.length !== uniqueValues.size) {
            notify(Type.error, 'Select unique order identifiers for each column.');
            return; // Stop execution and prevent saving
        }

        // Check for duplicate column names
        const nameValues = Object.values(editedColumnNames).map(name => name.trim().toLowerCase());
        const nameSet = new Set(nameValues);
        if(nameValues.length !== nameSet.size) {
            notify(Type.error, 'Each column must have a unique name!');
            return;
        }

        // Validate multiple choice options
        for (const columnId in editedColumnTypes) {
            if (editedColumnTypes[columnId] === entryTypeOptions.MULTIPLE_CHOICE && !validateEntryOptions(columnId)) {
                return;
            }
        }

        try {
            console.log("Saving column changes:", columnOrder, editedColumnNames);

            const projectId = await getDocumentIdByEmailAndProjectName(Email, SelectedProject);
            if (!projectId) {
                console.error(`No project found with name: ${SelectedProject}`);
                notify(Type.error, 'Project not found');
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
                            entry_options: newType === entryTypeOptions.MULTIPLE_CHOICE ? editedDropdownOptions[columnId] || [] : [],
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
                
                // Refresh columns data without full page reload
                refreshTrigger((prev) => prev + 1);
                if (typeof triggerRefresh === 'function') {
                    triggerRefresh();
                }
            }
        } catch (error) {
            console.error("Error updating columns:", error);
            notify(Type.error, 'Failed to update column order or names');
        }
    };

    // Column editing modal component
    const ColumnEditModal = ({ column }) => {
        // Track initial state for the column being edited
        const [initialState] = useState({
            type: editedColumnTypes[column.id],
            required: editedRequiredFields[column.id],
            identifier: editedIdentifierDomains[column.id],
            allowNegative: editedAllowNegative[column.id],
            options: [...(editedDropdownOptions[column.id] || [])]
        });
        
        // Create local state for entry options to avoid the infinite loop
        const [localOptions, setLocalOptions] = useState(() => {
            const options = [...(editedDropdownOptions[column.id] || [])];
            if (!options.includes("Add Here")) {
                options.unshift("Add Here");
            }
            return options;
        });
        
        // Validate data types using the same logic as ColumnOptions
        const validateDataType = (columnId, type, options) => {
            // For multiple choice, ensure we have at least 2 unique options
            if (type === entryTypeOptions.MULTIPLE_CHOICE) {
                const filteredOptions = options.filter(opt => 
                    opt !== "Add Here" && opt.trim() !== ""
                );
                
                if (filteredOptions.length < 2) {
                    notify(Type.error, 'Multiple choice columns must have at least 2 options');
                    return false;
                }
                
                // Check for uniqueness
                const uniqueOptions = new Set(filteredOptions);
                if (uniqueOptions.size < 2) {
                    notify(Type.error, 'Entry choices must include at least two unique values.');
                    return false;
                }
                
                // Check option length limits (like in ColumnOptions)
                const ENTRY_OPTION_MAX_LENGTH = 50; // Same as in fieldConstraints.js
                for (const option of filteredOptions) {
                    if (option.length > ENTRY_OPTION_MAX_LENGTH) {
                        notify(Type.error, `Option "${option}" exceeds maximum length of ${ENTRY_OPTION_MAX_LENGTH} characters.`);
                        return false;
                    }
                }
            }
            
            return true;
        };
        
        // This prevents the refresh when changing type
        const handleLocalTypeChange = (newType) => {
            // Update the type in parent state
            handleColumnTypeChange(column.id, newType);
            
            // If switching to multiple choice and there are no existing options,
            // make sure we have some default options ready
            if (newType === entryTypeOptions.MULTIPLE_CHOICE && (!editedDropdownOptions[column.id] || editedDropdownOptions[column.id].length === 0)) {
                const defaultOptions = ['Option 1', 'Option 2'];
                // Update the parent's options
                setEditedDropdownOptions(prev => ({
                    ...prev,
                    [column.id]: defaultOptions
                }));
                
                // Update local options with Add Here
                setLocalOptions(['Add Here', ...defaultOptions]);
            }
        };
        
        // This will be called when the modal is closed with "Done"
        const handleDoneEditing = () => {
            // Handle multiple choice options
            if (editedColumnTypes[column.id] === entryTypeOptions.MULTIPLE_CHOICE) {
                // Filter out "Add Here"
                const filteredOptions = localOptions.filter(opt => opt !== "Add Here");
                
                // Validate options using the shared validation logic
                if (!validateDataType(column.id, entryTypeOptions.MULTIPLE_CHOICE, localOptions)) {
                    return;
                }
                
                // Update parent state with options
                setEditedDropdownOptions(prev => ({
                    ...prev,
                    [column.id]: filteredOptions
                }));
            }
            
            // Check if any changes were made in the edit modal
            const currentOptions = localOptions.filter(opt => opt !== "Add Here");
            const hasChangesInEdit = 
                initialState.type !== editedColumnTypes[column.id] || 
                initialState.required !== editedRequiredFields[column.id] || 
                initialState.identifier !== editedIdentifierDomains[column.id] || 
                initialState.allowNegative !== editedAllowNegative[column.id] || 
                JSON.stringify(initialState.options) !== JSON.stringify(
                    editedColumnTypes[column.id] === entryTypeOptions.MULTIPLE_CHOICE ? currentOptions : []
                );
            
            if (!hasChangesInEdit) {
                notify(Type.error, 'No changes were made to the column.');
            } else {
                notify(Type.success, 'Column settings saved. Remember to save all changes when done.');
            }
            
            setEditingColumn(null);
        };
        
        return (
            <WindowWrapper
                header={`Edit Column: ${editedColumnNames[column.id]}`}
                onLeftButton={() => setEditingColumn(null)}
                onRightButton={handleDoneEditing}
                leftButtonText="Cancel"
                rightButtonText="Done"
            >
                <div className="flex flex-col space-y-4 p-4">
                    <div className="flex items-center mb-2">
                        <h3 className="text-sm font-semibold">Column Type:</h3>
                        <InfoIcon 
                            text="The data type determines what kind of information can be stored in this column."
                            position="right"
                            className="ml-2"
                            size={14}
                        />
                    </div>
                    
                    <RadioButtons
                        layout="horizontal"
                        options={Object.values(entryTypeOptions).filter(type => type !== entryTypeOptions.AUTO_ID)}
                        selectedOption={editedColumnTypes[column.id]}
                        setSelectedOption={handleLocalTypeChange}
                    />

                    {editedColumnTypes[column.id] === entryTypeOptions.MULTIPLE_CHOICE && (
                        <div className="mt-2">
                            <div className="flex items-center mb-2">
                                <h3 className="text-sm font-semibold">Entry Choices:</h3>
                                <InfoIcon 
                                    text="Add at least two options for users to select from. Click 'Add Here' to add a new option."
                                    position="right"
                                    className="ml-2"
                                    size={14}
                                />
                            </div>
                            <DropdownFlex
                                options={localOptions}
                                setOptions={setLocalOptions}
                                label="Entry Choices"
                            />
                        </div>
                    )}

                    {(editedColumnTypes[column.id] === entryTypeOptions.INTEGER ||
                        editedColumnTypes[column.id] === entryTypeOptions.DECIMAL) && (
                            <div className="flex items-center space-x-2">
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
                                <InfoIcon
                                    text="When set to Yes, users will be allowed to enter negative numbers in this field."
                                    position="right"
                                    className="ml-2"
                                    size={14}
                                />
                            </div>
                        )}

                    <div className="flex items-center space-x-2">
                        <YesNoSelector
                            label="Required Field"
                            layout="horizontal-start"
                            selection={editedRequiredFields[column.id]}
                            setSelection={(value) => handleRequiredFieldChange(column.id, value)}
                        />
                        <InfoIcon
                            text="When set to Yes, users must provide a value for this field to save an entry."
                            position="right"
                            className="ml-2"
                            size={14}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <YesNoSelector
                            label="Include in Entry ID Domain"
                            layout="horizontal-start"
                            selection={editedIdentifierDomains[column.id]}
                            setSelection={(value) => handleIdentifierDomainChange(column.id, value)}
                        />
                        <InfoIcon
                            text="If enabled, this field will be used when generating unique identifiers for entries."
                            position="right"
                            className="ml-2"
                            size={14}
                        />
                    </div>
                </div>
            </WindowWrapper>
        );
    };
    
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
                    ) : error ? (
                        <div className="text-center text-red-500">{error}</div>
                    ) : columns.length === 0 ? (
                        <div className="text-center">No columns found for this tab</div>
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
                                        className="flex-grow border rounded px-2 py-1"
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