import React, { useState, useEffect } from 'react';
import { DropdownSelector, IdentificationGenerator_UI } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { getColumnsCollection, addEntry, updateEntry } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';
import { useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';
import { entryTypeOptions } from '../utils/globals.js';
import { idAlreadyUsed } from '../utils/IdentificationGenerator';
// Add this import if not already present at the top of the file
import { Type, notify } from '../components/Notifier';

// The existing getEntriesWithIdFields function can remain as is, or you can enhance it like below:

export const getEntriesWithIdFields = async (projectName, tabName, email, identifierEntries) => {
    try {
            console.log('Looking up entries with identifier fields:', identifierEntries);
                    
                            const projectRef = collection(db, 'Projects');
                                    const projectQuery = query(
                                                projectRef,
                                                            and(
                                                                            where('project_name', '==', projectName),
                                                                                            or(
                                                                                                                where('contributors', 'array-contains', email),
                                                                                                                                    where('admins', 'array-contains', email),
                                                                                                                                                        where('owners', 'array-contains', email)
                                                                                                                                                                        )
                                                                                                                                                                                    )
                                                                                                                                                                                            );
                                                                                                                                                                                                    const projectSnapshot = await getDocs(projectQuery);

                                                                                                                                                                                                            if (projectSnapshot.empty) {
                                                                                                                                                                                                                        console.error('Project not found:', projectName);
                                                                                                                                                                                                                                    return [];
                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                    const projectDoc = projectSnapshot.docs[0];

                                                                                                                                                                                                                                                            const tabsRef = collection(projectDoc.ref, 'Tabs');
                                                                                                                                                                                                                                                                    const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
                                                                                                                                                                                                                                                                            const tabSnapshot = await getDocs(tabQuery);

                                                                                                                                                                                                                                                                                    if (tabSnapshot.empty) {
                                                                                                                                                                                                                                                                                                console.error('Tab not found:', tabName);
                                                                                                                                                                                                                                                                                                            return [];
                                                                                                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                                                                                                            const tabDoc = tabSnapshot.docs[0];

                                                                                                                                                                                                                                                                                                                                    const entriesRef = collection(tabDoc.ref, 'Entries');
                                                                                                                                                                                                                                                                                                                                            const entriesSnapshot = await getDocs(entriesRef);

                                                                                                                                                                                                                                                                                                                                                    // Filter entries by identifier field matches
                                                                                                                                                                                                                                                                                                                                                            const matchingEntries = entriesSnapshot.docs
                                                                                                                                                                                                                                                                                                                                                                        .filter(doc => {
                                                                                                                                                                                                                                                                                                                                                                                        const data = doc.data();
                                                                                                                                                                                                                                                                                                                                                                                                        const entryData = data.entry_data || {};
                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                        // Skip deleted entries
                                                                                                                                                                                                                                                                                                                                                                                                                                                        if (data.deleted === true) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            return false;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            // Check if all identifier fields match
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            return Object.entries(identifierEntries).every(([key, value]) => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                const entryValue = entryData[key];
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    // Convert to string for comparison (handles different data types)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        return entryValue !== undefined && String(entryValue).toLowerCase() === String(value).toLowerCase();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    })
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                .map(doc => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                return doc.data().entry_data['Entry ID'];
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            })
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .filter(Boolean); // Remove undefined or null values

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                console.log('Found matching entries:', matchingEntries);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        return matchingEntries;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            } catch (error) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    console.error('Error in getEntriesWithIdFields:', error);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            return [];
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                };

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                // Add the getEntryDetailsByID function to fetch an entry by its ID
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                export const getEntryDetailsByID = async (email, projectName, tabName, entryID) => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    try {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            const projectRef = collection(db, 'Projects');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    const projectQuery = query(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                projectRef,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            and(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            where('project_name', '==', projectName),
export default function NewEntry({ CloseNewEntry, existingEntry = false, onEntryUpdated }) {
    const [columnsCollection, setColumnsCollection] = useState([]);
    const [userEntries, setUserEntries] = useState({});
    const [hasAutoId, setHasAutoId] = useState(false);
    const [resetIdEntry, setResetIdEntry] = useState(false);

    const projectName = useAtomValue(currentProjectName);
    const tabName = useAtomValue(currentTableName);
    const email = useAtomValue(currentUserEmail);

    useEffect(() => {
        const fetchData = async () => {
            await loadCollection();
        };
        fetchData();
    }, [projectName, tabName, email]);

    const formatDateTime = (date) => {
        const d = new Date(date);
        return (
            d.getFullYear() +
            '/' +
            String(d.getMonth() + 1).padStart(2, '0') +
            '/' +
            String(d.getDate()).padStart(2, '0') +
            ' ' +
            String(d.getHours()).padStart(2, '0') +
            ':' +
            String(d.getMinutes()).padStart(2, '0') +
            ':' +
            String(d.getSeconds()).padStart(2, '0')
        );
    };

    useEffect(() => {
        if (existingEntry && existingEntry.entry_data) {
            setUserEntries(existingEntry.entry_data);
        }
    }, [existingEntry]);

    const loadCollection = async () => {
        const columns = await getColumnsCollection(projectName, tabName, email);
        setColumnsCollection(columns);
        setHasAutoId(columns.some(column => column.data_type === entryTypeOptions.AUTO_ID));

        if (!existingEntry) {
            const defaultEntries = {};
            columns.forEach((column) => {
                const { name, data_type } = column;
                if (data_type === entryTypeOptions.INTEGER || data_type === entryTypeOptions.DECIMAL) {
                    defaultEntries[name] = '';
                } else if (data_type === entryTypeOptions.DATE) {
                    defaultEntries[name] = formatDateTime(new Date());
                } else if (data_type === entryTypeOptions.MULTIPLE_CHOICE) {
                    defaultEntries[name] = 'Select';
                } else if (data_type === entryTypeOptions.AUTO_ID) {
                    defaultEntries[name] = '';
                } else {
                    defaultEntries[name] = '';
                }
            });

            setUserEntries(defaultEntries);
        }
    };


    const handleInputChange = (name, value) => {
        setUserEntries((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const parseDateTimeInput = (input) => {
        if (!input || typeof input !== 'string' || !input.includes(' ')) return '';
        const [date, time] = input.split(' ');
        return date.replace(/\//g, '-') + 'T' + time;
    };

    const validEntries = async () => {
        for (const column of columnsCollection.sort((a, b) => a.order - b.order)) {
            const { name, data_type, required_field, identifier_domain } = column;
            const value = userEntries[name];

            if (value && data_type !== entryTypeOptions.MULTIPLE_CHOICE) {
                if (data_type === entryTypeOptions.INTEGER && !/^-?\d+$/.test(value)) {
                    notify(Type.error, `The field "${name}" must be a valid integer number.`);
                    return false;
                }

                if (data_type === entryTypeOptions.DECIMAL && !/^-?\d+\.\d+$/.test(value)) {
                    notify(Type.error, `The field "${name}" must be a valid decimal number.`);
                    return false;
                }

                if (data_type === entryTypeOptions.DATE && !/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
                    notify(
                        Type.error,
                        `The field "${name}" must be in the format YYYY/MM/DD HH:MM:SS.`,
                    );
                    return false;
                }

                if (data_type === entryTypeOptions.AUTO_ID && !/^(?:[A-Z]+[0-9]+)(?:-[A-Z]+[0-9]+)*$/i.test(value)) {
                    notify(Type.error, `Please enter a valid code for "${name}".`);
                    return false;
                }

                if (value && data_type === entryTypeOptions.AUTO_ID) {
                    const idIsAlreadyUsed = await idAlreadyUsed(email, projectName, tabName, value, userEntries);
                    if (idIsAlreadyUsed) {
                        notify(Type.error, idIsAlreadyUsed);
                        return false;
                    }
                }
            }

            if ((required_field || identifier_domain) && (value === '' || value === null || value === undefined || value === 'Select')) {
                notify(Type.error, `"${name}" is a ${required_field ? 'required' : 'ID domain'} ${data_type} field that must be entered.`);
                return false;
            }
        }

        return true;
    };

    const submitEntry = async () => {
        const areValid = await validEntries();
        if (!areValid) return;
        const formattedEntries = { ...userEntries };

        columnsCollection.forEach((column) => {
            const { name, data_type } = column;

            if (data_type === entryTypeOptions.INTEGER) {
                if (!Number.isInteger(Number(formattedEntries[name]))) {
                    notify(Type.error, `The field "${name}" must be an integer (whole number).`);
                    throw new Error("Whole number column must be integer");
                }
                formattedEntries[name] = Number(formattedEntries[name]) || 0;
            } else if (data_type === entryTypeOptions.DECIMAL) {
                formattedEntries[name] = Number(formattedEntries[name]) || 0;
            } else if (data_type === entryTypeOptions.DATE) {
                formattedEntries[name] = new Date(formattedEntries[name]).toISOString();
            }
        });

        try {
            if (existingEntry) {
                await updateEntry(projectName, tabName, email, existingEntry.id, formattedEntries);
                notify(Type.success, `Entry updated.`);
            } else {
                await addEntry(projectName, tabName, email, formattedEntries);
                notify(Type.success, `Entry submitted.`);
            }

            CloseNewEntry();

            if (onEntryUpdated) {
                await onEntryUpdated();
            }

        } catch (error) {
            console.error("Error saving entry:", error);
            notify(Type.error, "Failed to save entry.");
        }
    };

    const idReset = () => {
        if (hasAutoId) {
            setResetIdEntry((prev) => !prev);
        }
    }

    const renderDynamicInputs = () => {
        const sortedColumns = [...columnsCollection].sort((a, b) => a.order - b.order);

        return sortedColumns.map((column, index) => {
            const { name, data_type, entry_options = [], required_field, identifier_domain } = column;

            if (data_type === entryTypeOptions.MULTIPLE_CHOICE) {
                return (
                    <DropdownSelector
                        key={index}
                        label={name}
                        options={['Select', ...entry_options]}
                        selection={userEntries[name] || ''}
                        setSelection={(selectedOption) => {
                            if (identifier_domain) {
                                idReset();
                            }
                            handleInputChange(name, selectedOption)
                        }}
                        layout="horizontal-single"
                    />
                );
            }


            if (data_type === entryTypeOptions.AUTO_ID) {
                return (
                    <IdentificationGenerator_UI
                        key={index}
                        label={tabName}
                        handleInputChange={handleInputChange}
                        userEntries={userEntries || {}}
                        reset={resetIdEntry}
                    />
                );
            }

            const inputType = data_type === entryTypeOptions.DATE ? 'datetime-local' : 'text';

            return (
                <InputLabel
                    key={index}
                    label={name}
                    layout="horizontal-single"
                    input={
                        <input
                            type={inputType}
                            placeholder={name}
                            required={required_field}
                            value={
                                data_type === entryTypeOptions.DATE
                                    ? parseDateTimeInput(userEntries[name])
                                    : userEntries[name] || ''
                            }
                            onChange={(e) => {
                                const value = e.target.value;
                                if (identifier_domain) {
                                    idReset();
                                }
                                handleInputChange(
                                    name,
                                    data_type === entryTypeOptions.DATE ? formatDateTime(value) : value
                                );
                            }}
                        />
                    }
                />
            );
        });
    };


    return (
        <WindowWrapper
            header={existingEntry ? "Edit Entry" : "New Entry"}
            onLeftButton={CloseNewEntry}
            onRightButton={submitEntry}
            leftButtonText="Cancel"
            rightButtonText={existingEntry ? "Update Entry" : "Submit Entry"}
        >
            <div className="flex flex-col space-y-4">{renderDynamicInputs()}</div>
        </WindowWrapper>
    );
}
