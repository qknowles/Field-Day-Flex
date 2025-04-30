import React, { useState, useEffect } from 'react';
import { DropdownSelector, IdentificationGenerator_UI } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { getColumnsCollection, addEntry, updateEntry, getEntriesForTab } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';
import { useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';
import { entryTypeOptions } from '../utils/globals.js';
import { idAlreadyUsed } from '../utils/IdentificationGenerator';

export default function NewEntry({ CloseNewEntry, existingEntry = false, onEntryUpdated }) {
    const [columnsCollection, setColumnsCollection] = useState([]);
    const [userEntries, setUserEntries] = useState({});
    const [hasAutoId, setHasAutoId] = useState(false);
    const [resetIdEntry, setResetIdEntry] = useState(false);
    const [historicalEntries, setHistoricalEntries] = useState([]);
    const [idDomainFields, setIdDomainFields] = useState([]);
    const [idDomainComplete, setIdDomainComplete] = useState(false);

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

        // Get and store the ID domain fields
        const domainFields = columns
            .filter(column => column.identifier_domain === true && column.name !== 'Entry ID')
            .map(column => column.name);
        setIdDomainFields(domainFields);

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

    // Check if all ID domain fields are filled and look up history
    useEffect(() => {
        const checkIdDomainCompletion = async () => {
            if (idDomainFields.length === 0) return;

            const allFieldsFilled = idDomainFields.every(field => {
                const value = userEntries[field];
                return value !== '' && value !== null && value !== undefined && value !== 'Select';
            });

            setIdDomainComplete(allFieldsFilled);

            if (allFieldsFilled) {
                await lookupHistory();
            } else {
                setHistoricalEntries([]);
            }
        };

        checkIdDomainCompletion();
    }, [userEntries, idDomainFields]);

    // Function to look up historical entries with matching ID domain fields
    const lookupHistory = async () => {
        try {
            const allEntries = await getEntriesForTab(projectName, tabName, email);
            if (!allEntries || allEntries.length === 0) return;

            // Filter out deleted entries and entries that match the current entry being edited
            const validEntries = allEntries.filter(entry =>
                !entry.deleted &&
                (!existingEntry || entry.id !== existingEntry.id)
            );

            // Filter for entries that match all ID domain field values
            const matchingEntries = validEntries.filter(entry => {
                if (!entry.entry_data) return false;

                return idDomainFields.every(field => {
                    const currentValue = userEntries[field];
                    const entryValue = entry.entry_data[field];

                    // Make sure we're comparing the same types (string to string)
                    // Trim strings to handle any whitespace issues
                    const currentValueStr = currentValue !== undefined && currentValue !== null ?
                        String(currentValue).trim() : '';
                    const entryValueStr = entryValue !== undefined && entryValue !== null ?
                        String(entryValue).trim() : '';

                    return currentValueStr === entryValueStr;
                });
            });

            // Sort entries by date (newest first)
            matchingEntries.sort((a, b) => {
                if (!a.entry_date) return 1;
                if (!b.entry_date) return -1;

                // Handle different date formats
                const dateA = typeof a.entry_date === 'string' ? new Date(a.entry_date) : a.entry_date;
                const dateB = typeof b.entry_date === 'string' ? new Date(b.entry_date) : b.entry_date;

                return dateB - dateA;
            });

            setHistoricalEntries(matchingEntries);

            // Notify user if historical entries were found
            if (matchingEntries.length > 0) {
                notify(
                    Type.info,
                    `Found ${matchingEntries.length} historical ${matchingEntries.length === 1 ? 'entry' : 'entries'} with matching ID fields.`
                );
            }
        } catch (error) {
            console.error("Error looking up historical entries:", error);
        }
    };

    // Helper function to display a historical entry in a readable format
    const formatHistoricalEntry = (entry) => {
        if (!entry || !entry.entry_data) return "";

        // Create a formatted string with the entry date and key data points
        const date = entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : "Unknown date";

        // Return a summary of the entry
        let summary = `${date}: `;

        // Add Entry ID if it exists
        if (entry.entry_data['Entry ID']) {
            summary += `ID: ${entry.entry_data['Entry ID']} `;
        }

        // Add a few key fields that aren't ID domain fields
        const nonDomainFields = Object.keys(entry.entry_data)
            .filter(key => !idDomainFields.includes(key) && key !== 'Entry ID')
            .slice(0, 3); // Take up to 3 additional fields

        nonDomainFields.forEach(field => {
            summary += `${field}: ${entry.entry_data[field] || 'N/A'} `;
        });

        return summary;
    };

    const handleInputChange = (name, value) => {
        setUserEntries((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Fill form with values from a historical entry
    const fillFromHistory = (entry) => {
        if (!entry || !entry.entry_data) return;

        // We don't want to overwrite ID domain fields because they're already correctly set
        // (and are what matched this historical entry)
        const updatedEntries = { ...userEntries };

        Object.keys(entry.entry_data).forEach(field => {
            // Skip ID domain fields and Entry ID
            if (!idDomainFields.includes(field) && field !== 'Entry ID') {
                updatedEntries[field] = entry.entry_data[field];
            }
        });

        setUserEntries(updatedEntries);
        notify(Type.success, "Form filled with historical data. You can edit before submitting.");
    };

    const parseDateTimeInput = (input) => {
        if (!input || typeof input !== 'string' || !input.includes(' ')) return '';
        const [date, time] = input.split(' ');
        return date.replace(/\//g, '-') + 'T' + time;
    };

    const validEntries = async () => {

        const isEmpty = (value) =>
            value === '' ||
            value === null ||
            value === undefined ||
            value === 'Select' ||
            (Array.isArray(value) && value.length === 0);

        const allEmpty = columnsCollection.every(
            ({ name }) => isEmpty(userEntries[name])
        );

        if (allEmpty) {
            notify(Type.error, 'Form cannot be empty.');
            return false;
        }

        const nothingChanged = columnsCollection.every(
            ({ name }) => existingEntry.entry_data && userEntries[name] === existingEntry.entry_data[name]
        );

        if (existingEntry && nothingChanged) {
            notify(Type.error, `No changes were made.`);
            return false;
        }

        for (const column of columnsCollection.sort((a, b) => a.order - b.order)) {
            const { name, data_type, required_field, identifier_domain } = column;
            const value = userEntries[name];

            if (value && data_type !== entryTypeOptions.MULTIPLE_CHOICE) {
                if (data_type === entryTypeOptions.INTEGER) {
                    if (!/^-?\d+$/.test(value)) {
                        notify(Type.error, `The field "${name}" must be a valid integer number.`);
                        return false;
                    }
                    if (!column.allow_negative && Number(value) < 0) {
                        notify(Type.error, `Negative values are not allowed for "${name}".`);
                        return false;
                    }
                }

                if (data_type === entryTypeOptions.DECIMAL) {
                    if (!/^-?\d+(\.\d+)?$/.test(value)) {
                        notify(Type.error, `The field "${name}" must be a valid decimal number.`);
                        return false;
                    }
                    if (!column.allow_negative && Number(value) < 0) {
                        notify(Type.error, `Negative values are not allowed for "${name}".`);
                        return false;
                    }
                }

                if (
                    data_type === entryTypeOptions.DATE &&
                    !/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
                ) {
                    notify(
                        Type.error,
                        `The field "${name}" must be in the format YYYY/MM/DD HH:MM:SS.`
                    );
                    return false;
                }

                if (
                    data_type === entryTypeOptions.AUTO_ID &&
                    !/^(?:[A-Z]+[0-9]+)(?:-[A-Z]+[0-9]+)*$/i.test(value)
                ) {
                    notify(Type.error, `Please enter a valid code for "${name}".`);
                    return false;
                }

                if (data_type === entryTypeOptions.AUTO_ID) {
                    const idIsAlreadyUsed = await idAlreadyUsed(email, projectName, tabName, value, userEntries);
                    if (idIsAlreadyUsed) {
                        notify(Type.error, idIsAlreadyUsed);
                        return false;
                    }
                }
            }

            if ((required_field || identifier_domain) && isEmpty(value)) {
                notify(Type.error, `"${name}" is a ${required_field ? 'required' : 'ID domain'} ${data_type} field that must be entered.`);
                return false;
            }
        }

        return true;
    };

    const submitEntry = async () => {
        const areValid = await validEntries();
        if (!areValid) return;

        try {
            if (existingEntry) {
                await updateEntry(projectName, tabName, email, existingEntry.id, userEntries);
                notify(Type.success, `Entry updated.`);
            } else {
                await addEntry(projectName, tabName, email, userEntries);
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
                                    : userEntries[name] ?? ''
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

    // Render historical entries section
    const renderHistoricalEntries = () => {
        if (!idDomainComplete || historicalEntries.length === 0) return null;

        return (
            <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded mb-4">
                <h3 className="font-semibold mb-2">Historical Entries ({historicalEntries.length})</h3>
                <div className="max-h-40 overflow-y-auto">
                    {historicalEntries.map((entry, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center p-2 mb-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded cursor-pointer"
                            onClick={() => fillFromHistory(entry)}
                        >
                            <span>{formatHistoricalEntry(entry)}</span>
                            <button
                                className="bg-asu-maroon text-white px-2 py-1 rounded text-xs"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering the parent onClick
                                    fillFromHistory(entry);
                                }}
                            >
                                Fill Form
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <WindowWrapper
            header={existingEntry ? "Edit Entry" : "New Entry"}
            onLeftButton={CloseNewEntry}
            onRightButton={submitEntry}
            leftButtonText="Cancel"
            rightButtonText={existingEntry ? "Update Entry" : "Submit Entry"}
        >
            {renderHistoricalEntries()}
            <div className="flex flex-col space-y-4">{renderDynamicInputs()}</div>
        </WindowWrapper>
    );
}
