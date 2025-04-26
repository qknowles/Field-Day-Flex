import React, { useEffect, useState } from 'react';
import { RadioButtons, YesNoSelector, DropdownFlex } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import { Type, notify } from '../components/Notifier';
import { getColumnsCollection, getDocumentIdByEmailAndProjectName } from '../utils/firestore';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';
import Button from '../components/Button';

export default function ManageColumns({ CloseManageColumns }) {
    const SelectedProject = useAtomValue(currentProjectName);
    const TabName = useAtomValue(currentTableName);
    const Email = useAtomValue(currentUserEmail);

    const [columns, setColumns] = useState([]);
    const [columnOrder, setColumnOrder] = useState({});
    const [editedColumnNames, setEditedColumnNames] = useState({});
    const [editedColumnTypes, setEditedColumnTypes] = useState({});
    const [editedRequiredFields, setEditedRequiredFields] = useState({});
    const [editedIdentifierDomains, setEditedIdentifierDomains] = useState({});
    const [editedAllowNegative, setEditedAllowNegative] = useState({});
    const [editedDropdownOptions, setEditedDropdownOptions] = useState({});
    const [loading, setLoading] = useState(true);

    // Modal editing state
    const [modalColumnId, setModalColumnId] = useState(null);

    useEffect(() => {
        loadColumns();
    }, [SelectedProject, TabName, Email]);

    // Load column metadata from Firestore
    const loadColumns = async () => {
        try {
            setLoading(true);
            const data = (await getColumnsCollection(SelectedProject, TabName, Email)).filter(col => !col.deleted);

            if (!data.length) {
                notify(Type.error, 'No columns found');
                return;
            }

            data.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));

            const names = {};
            const types = {};
            const required = {};
            const identifiers = {};
            const allowNeg = {};
            const dropdowns = {};
            const orders = {};

            data.forEach((col, index) => {
                names[col.id] = col.name || '';
                types[col.id] = col.data_type;
                required[col.id] = col.required_field ?? false;
                identifiers[col.id] = col.identifier_domain ?? false;
                allowNeg[col.id] = col.allow_negative ?? false;
                dropdowns[col.id] = col.entry_options || [];
                orders[col.id] = index + 1;
            });

            setColumns(data);
            setEditedColumnNames(names);
            setEditedColumnTypes(types);
            setEditedRequiredFields(required);
            setEditedIdentifierDomains(identifiers);
            setEditedAllowNegative(allowNeg);
            setEditedDropdownOptions(dropdowns);
            setColumnOrder(orders);
        } catch (error) {
            console.error('Error loading columns:', error);
            notify(Type.error, 'Failed to load columns');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        const orders = Object.values(columnOrder);
        if (orders.length !== new Set(orders).size) {
            notify(Type.error, 'Select unique order identifiers for each column.');
            return;
        }

        const names = Object.values(editedColumnNames).map(name => name.trim().toLowerCase());
        if (names.length !== new Set(names).size) {
            notify(Type.error, 'Each column must have a unique name!');
            return;
        }

        try {
            const projectId = await getDocumentIdByEmailAndProjectName(Email, SelectedProject);
            if (!projectId) {
                notify(Type.error, `Project not found: ${SelectedProject}`);
                return;
            }

            const batch = writeBatch(db);
            const columnDocs = await getColumnsCollection(SelectedProject, TabName, Email);
            const columnIdMap = Object.fromEntries(columnDocs.map(col => [col.id, col]));

            const nameChanges = {};
            let updatesMade = false;

            for (const columnId in columnOrder) {
                if (!columnIdMap[columnId]) continue;

                const oldName = columnIdMap[columnId].name;
                const newName = editedColumnNames[columnId] || oldName;
                const newType = editedColumnTypes[columnId] || columnIdMap[columnId].data_type;

                if (oldName !== newName) nameChanges[oldName] = newName;

                batch.update(doc(db, 'Projects', projectId, 'Tabs', TabName, 'Columns', columnId), {
                    order: columnOrder[columnId],
                    name: newName,
                    data_type: newType,
                    required_field: editedRequiredFields[columnId],
                    identifier_domain: editedIdentifierDomains[columnId],
                    allow_negative: editedAllowNegative[columnId],
                    entry_options: newType === 'multiple choice' ? editedDropdownOptions[columnId] || [] : [],
                });

                updatesMade = true;
            }

            if (updatesMade) {
                await batch.commit();

                if (Object.keys(nameChanges).length > 0) {
                    await updateEntryNames(projectId, nameChanges);
                }

                notify(Type.success, 'Columns updated successfully!');
            } else {
                notify(Type.success, 'No changes detected.');
            }

            await loadColumns();
            CloseManageColumns();
        } catch (error) {
            console.error('Error saving changes:', error);
            notify(Type.error, 'Failed to save changes.');
        }
    };


    // Update entry records if column names changed
    const updateEntryNames = async (projectId, nameChanges) => {
        const entriesRef = collection(db, 'Projects', projectId, 'Tabs', TabName, 'Entries');
        const entriesSnapshot = await getDocs(entriesRef);
        const batch = writeBatch(db);

        entriesSnapshot.forEach(docSnap => {
            const entryRef = doc(db, 'Projects', projectId, 'Tabs', TabName, 'Entries', docSnap.id);
            const data = docSnap.data();
            const updatedData = { ...data.entry_data };

            let changed = false;
            for (const oldName in nameChanges) {
                if (oldName in updatedData) {
                    updatedData[nameChanges[oldName]] = updatedData[oldName];
                    delete updatedData[oldName];
                    changed = true;
                }
            }

            if (changed) {
                batch.update(entryRef, { entry_data: updatedData });
            }
        });

        await batch.commit();
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
                    ) : columns.length === 0 ? (
                        <div className="text-center">No columns found</div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center px-4 py-1 mb-2 rounded bg-neutral-200 dark:bg-neutral-800">
                                <label className="text-black dark:text-white text-sm font-semibold tracking-wide">
                                    Column Name
                                </label>
                                <label className="pr-[50px] text-black dark:text-white text-sm font-semibold tracking-wide">
                                    Column Order
                                </label>
                            </div>

                            {columns.map((col) => (
                                <div key={col.id} className="flex items-center space-x-4 p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                                    <input
                                        type="text"
                                        value={editedColumnNames[col.id] || ''}
                                        onChange={(e) => setEditedColumnNames(prev => ({ ...prev, [col.id]: e.target.value }))}
                                        className="flex-grow border rounded px-2 py-1 text-white"
                                    />
                                    <select
                                        value={columnOrder[col.id]}
                                        onChange={(e) => setColumnOrder(prev => ({ ...prev, [col.id]: e.target.value }))}
                                        className="border rounded px-2 py-1"
                                    >
                                        {Array.from({ length: columns.length }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                    <Button
                                        text="Edit"
                                        onClick={() => setModalColumnId(col.id)}
                                    />
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </WindowWrapper>

            {modalColumnId && (
                <ColumnEditModal
                    columnId={modalColumnId}
                    closeModal={() => setModalColumnId(null)}
                    type={editedColumnTypes[modalColumnId]}
                    required={editedRequiredFields[modalColumnId]}
                    identifier={editedIdentifierDomains[modalColumnId]}
                    allowNegative={editedAllowNegative[modalColumnId]}
                    dropdownOptions={editedDropdownOptions[modalColumnId]}
                    setType={(value) => setEditedColumnTypes(prev => ({ ...prev, [modalColumnId]: value }))}
                    setRequired={(value) => setEditedRequiredFields(prev => ({ ...prev, [modalColumnId]: value }))}
                    setIdentifier={(value) => setEditedIdentifierDomains(prev => ({ ...prev, [modalColumnId]: value }))}
                    setAllowNegative={(value) => setEditedAllowNegative(prev => ({ ...prev, [modalColumnId]: value }))}
                    setDropdownOptions={(options) => setEditedDropdownOptions(prev => ({ ...prev, [modalColumnId]: options }))}
                />
            )}
        </>
    );
}

// ---

function ColumnEditModal({
                             columnId,
                             closeModal,
                             type,
                             required,
                             identifier,
                             allowNegative,
                             dropdownOptions,
                             setType,
                             setRequired,
                             setIdentifier,
                             setAllowNegative,
                             setDropdownOptions
                         }) {
    const entryTypeOptions = ['whole number', 'decimal number', 'text', 'date', 'multiple choice'];
    const [tempOptions, setTempOptions] = useState(dropdownOptions || []);

    useEffect(() => {
        setTempOptions(dropdownOptions || []);
    }, [dropdownOptions]);

    return (
        <WindowWrapper
            header="Edit Column"
            onLeftButton={closeModal}
            onRightButton={() => {
                setDropdownOptions(tempOptions.filter(opt => opt !== 'Add Here'));
                closeModal();
            }}
            leftButtonText="Cancel"
            rightButtonText="Done"
        >
            <div className="flex flex-col space-y-4 p-4">
                <RadioButtons
                    label="Data Entry Type"
                    options={entryTypeOptions}
                    selectedOption={type}
                    setSelectedOption={setType}
                    layout="horizontal"
                />
                {type === 'multiple choice' && (
                    <DropdownFlex
                        options={tempOptions}
                        setOptions={setTempOptions}
                        label="Entry Choices"
                    />
                )}
                {(type === 'whole number' || type === 'decimal number') && (
                    <YesNoSelector
                        label="Allow Negative Values"
                        layout="horizontal-start"
                        selection={allowNegative}
                        setSelection={setAllowNegative}
                    />
                )}
                <YesNoSelector
                    label="Required Field"
                    layout="horizontal-start"
                    selection={required}
                    setSelection={setRequired}
                />
                <YesNoSelector
                    label="Include in Entry ID Domain"
                    layout="horizontal-start"
                    selection={identifier}
                    setSelection={setIdentifier}
                />
            </div>
        </WindowWrapper>
    );
}
