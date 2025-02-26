import React, { useState, useEffect } from 'react';
import { DropdownSelector, IdentificationGenerator_UI } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { getColumnsCollection, addEntry, updateEntry } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';
import { useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';
import error from 'eslint-plugin-react/lib/util/error.js';

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
            setHasAutoId(columnsCollection.some(column => column.data_type === 'auto_id'));
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

        if (!existingEntry) {
            const defaultEntries = {};
            columns.forEach((column) => {
                const { name, data_type } = column;
                if (data_type === 'whole number' || data_type ===  "decimal number") {
                    defaultEntries[name] = 0;
                } else if (data_type === 'date') {
                    defaultEntries[name] = formatDateTime(new Date());
                } else if (data_type === 'multiple choice') {
                    defaultEntries[name] = 'Select';
                } else if (data_type === 'auto_id') {
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

    const validEntries = () => {
        for (const column of columnsCollection) {
            const { name, data_type, required_field, identifier_domain } = column;
            const value = userEntries[name];

            if (data_type === 'number' && (value === '' || isNaN(value))) {
                notify(Type.error, `The field "${name}" must be a valid number.`);
                return false;
            }

            if(data_type === 'float' && (value === '' || isNaN(value))) {
                notify(Type.error, `The field "${name}" must be a valid decimal number.`);
            }

            if (data_type === 'date' && !/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
                notify(
                    Type.error,
                    `The field "${name}" must be in the format YYYY/MM/DD HH:MM:SS.`,
                );
                return false;
            }

            if (data_type === 'multiple choice' && value === 'Select') {
                notify(Type.error, `Please select a valid option for "${name}".`);
                return false;
            }

            if (data_type === 'auto_id' && !/^(?:[A-Z]+[0-9]+)(?:-[A-Z]+[0-9]+)*$/i.test(value)) {
                notify(Type.error, `Please enter a valid code for "${name}".`);
                return false;
            }
            
            if ((required_field === true || identifier_domain === true) && value === '' || value === null || value === undefined || value === 'Select') {
                notify(Type.error, `"${name}" is a ${required_field ? 'required' : 'ID domain'} field that must be entered.`);
                return false;
            }
        }

        return true;
    };

    const submitEntry = async () => {
        if (!validEntries()) throw new Error("Invalid entries");
        const formattedEntries = { ...userEntries };

        columnsCollection.forEach((column) => {
            const { name, data_type } = column;
    
            if (data_type === 'whole number') {
                if(!Number.isInteger(Number(formattedEntries[name]))) {
                    notify(Type.error, `The field "${name}" must be an integer (whole number).`);
                    throw new Error("Whole number column must be integer");
                }
                formattedEntries[name] = Number(formattedEntries[name]) || 0;
            } else if(data_type === "decimal number") {
                formattedEntries[name] = Number(formattedEntries[name]) || 0;
            } else if (data_type === 'date') {
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

            if (data_type === 'multiple choice') {
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


            if (data_type === 'auto_id') {
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

            const inputType =
                data_type === 'number'
                    ? 'number'
                    : data_type === 'date'
                        ? 'datetime-local'
                        : 'text';


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
                                data_type === 'date'
                                    ? parseDateTimeInput(userEntries[name])
                                    : userEntries[name] || ''
                            }
                            onChange={(e) => {
                                const value = e.target.value;
                                if (identifier_domain) {
                                    idReset();
                                }
                                handleInputChange(name, data_type === 'date' ? formatDateTime(value) : value);
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
