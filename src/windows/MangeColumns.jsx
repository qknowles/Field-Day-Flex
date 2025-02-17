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
import { getDoc } from 'firebase/firestore';
import { getProjectNames } from '../utils/firestore';
import { getTabNames } from '../utils/firestore';
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
    
            // Sort columns based on stored order
            columnsData.sort((a, b) => (a.order || 0) - (b.order || 0));
    
            setColumns(columnsData);
    
            const orderObj = {};
            const namesObj = {};
            
            columnsData.forEach((col, index) => {
                orderObj[col.id] = col.order || index + 1;
                namesObj[col.id] = col.name || ""; // Ensure name is not undefined
            });
    
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
        try {
            console.log("🔥 Saving column order:", columnOrder);
    
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
    
            console.log("🗺️ Firestore Column ID Map:", columnIdMap);
    
            let updatesMade = false;
            for (const columnId in columnOrder) {
                if (columnIdMap[columnId]) {
                    const columnRef = doc(db, 'Projects', projectId, 'Tabs', TabName, 'Columns', columnId);
                    batch.update(columnRef, {
                        order: columnOrder[columnId] // Updating the order field
                    });
                    updatesMade = true;
                } else {
                    console.error(`Firestore document with ID "${columnId}" does not exist`);
                }
            }
    
            if (updatesMade) {
                await batch.commit();
                console.log(" Firestore batch update committed successfully.");
                notify(Type.success, 'Column order updated successfully');
                window.dispatchEvent(new Event("refreshColumns")); // Refresh UI
            } else {
                console.warn(" No changes detected. Skipping Firestore update.");
            }
        } catch (error) {
            console.error(" Error updating column order:", error);
            notify(Type.error, 'Failed to update column order');
        }
    };
    
    
    

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
                                    value={
                                        columnsToDelete.includes(column.id)
                                            ? 'DELETE'
                                            : columnOrder[column.id]
                                    }
                                    onChange={(e) =>
                                        handleColumnOrderChange(column.id, e.target.value)
                                    }
                                    className="border rounded px-2 py-1"
                                >
                                    {Array.from({ length: columns.length }, (_, i) => i + 1).map(
                                        (num) => (
                                            <option key={num} value={num}>
                                                {num}
                                            </option>
                                        ),
                                    )}
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
