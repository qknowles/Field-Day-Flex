import React, { useEffect, useState } from 'react';
import { RadioButtons, YesNoSelector, DropdownFlex } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';
import { getColumnsCollection } from '../utils/firestore';
import Button from '../components/Button';
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function ManageColumns({
    CloseManageColumns,
    Email,
    SelectedProject,
    TabName
}) {
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

    const entryTypeOptions = ['number', 'text', 'date', 'multiple choice'];

    useEffect(() => {
        console.log('ManageColumns mounted with props:', { SelectedProject, TabName, Email });
        loadColumns();
    }, []);
    
    const loadColumns = async () => {
        try {
            console.log('Loading columns for:', SelectedProject, TabName, Email);
            const columnsData = await getColumnsCollection(SelectedProject, TabName, Email);
            console.log('Loaded columns:', columnsData);
            // Initialize state for each column
            const orderObj = {};
            const namesObj = {};
            const typesObj = {};
            const requiredObj = {};
            const identifierObj = {};
            const optionsObj = {};

            columnsData.forEach((col, index) => {
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
        } catch (error) {
            console.error('Error loading columns:', error);
            notify(Type.error, 'Failed to load columns');
        }
    };

    const handleColumnOrderChange = (columnId, newValue) => {
        if (newValue === 'DELETE') {
            setColumnsToDelete(prev => [...prev, columnId]);
        } else {
            setColumnOrder(prev => ({
                ...prev,
                [columnId]: parseInt(newValue)
            }));
            setColumnsToDelete(prev => prev.filter(id => id !== columnId));
        }
    };

    const handleColumnNameChange = (columnId, newName) => {
        setEditedColumnNames(prev => ({
            ...prev,
            [columnId]: newName
        }));
    };

    const handleColumnTypeChange = (columnId, newType) => {
        setEditedColumnTypes(prev => ({
            ...prev,
            [columnId]: newType
        }));
        if (newType !== 'multiple choice') {
            setEditedDropdownOptions(prev => ({
                ...prev,
                [columnId]: []
            }));
        }
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

    const handleDropdownOptionsChange = (columnId) => {
        const filteredOptions = tempEntryOptions.filter(option => option !== 'Add Here');
        setEditedDropdownOptions(prev => ({
            ...prev,
            [columnId]: filteredOptions
        }));
    };

    const handleSaveChanges = async () => {
        if (columnsToDelete.length > 0) {
            const confirmed = window.confirm(
                'Warning: Deleting columns will permanently remove all data contained in those columns. Continue?'
            );
            if (!confirmed) return;
        }

        try {
            const batch = writeBatch(db);

            // Handle updates and deletions
            for (const column of columns) {
                if (columnsToDelete.includes(column.id)) {
                    // Delete column
                    const columnRef = doc(db, 'Projects', SelectedProject, 'Tabs', TabName, 'Columns', column.id);
                    batch.delete(columnRef);

                    // Remove column data from entries
                    const entriesSnapshot = await getDocs(
                        collection(db, 'Projects', SelectedProject, 'Tabs', TabName, 'Entries')
                    );
                    entriesSnapshot.docs.forEach(entryDoc => {
                        const entryRef = doc(db, 'Projects', SelectedProject, 'Tabs', TabName, 'Entries', entryDoc.id);
                        const entryData = entryDoc.data();
                        delete entryData[column.name];
                        batch.update(entryRef, entryData);
                    });
                } else if (!['actions', 'datetime', 'identifier'].includes(column.id)) {
                    // Update column
                    const columnRef = doc(db, 'Projects', SelectedProject, 'Tabs', TabName, 'Columns', column.id);
                    batch.update(columnRef, {
                        name: editedColumnNames[column.id],
                        order: columnOrder[column.id],
                        data_type: editedColumnTypes[column.id],
                        required_field: editedRequiredFields[column.id],
                        identifier_domain: editedIdentifierDomains[column.id],
                        entry_options: editedColumnTypes[column.id] === 'multiple choice' ? 
                            editedDropdownOptions[column.id] : []
                    });
                }
            }

            await batch.commit();
            await loadColumns();
            notify(Type.success, 'Column changes saved successfully');
            CloseManageColumns();
        } catch (error) {
            console.error('Error saving column changes:', error);
            notify(Type.error, 'Failed to save column changes');
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
        columnOrder
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
                    {columns.map((column) => (
                        <div key={column.id} className="flex items-center space-x-4 p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                            <input
                                type="text"
                                value={editedColumnNames[column.id]}
                                onChange={(e) => handleColumnNameChange(column.id, e.target.value)}
                                className="flex-grow border rounded px-2 py-1"
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
                            <Button
                                text="Edit"
                                onClick={() => {
                                    setTempEntryOptions(editedDropdownOptions[column.id] || []);
                                    setEditingColumn(column);
                                }}
                            />
                        </div>
                    ))}
                </div>
            </WindowWrapper>

            {editingColumn && <ColumnEditModal column={editingColumn} />}
        </>
    );
}