import React, { useState, useEffect } from 'react';
import { DropdownSelector, IdentificationGenerator_UI } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { getColumnsCollection, addEntry, updateEntry } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';
import { useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';

export default function NewEntry({ CloseNewEntry, existingEntry, onEntryUpdated }) {
    const [columnsCollection, setColumnsCollection] = useState([]);
    const [userEntries, setUserEntries] = useState({});

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
    
        if (!existingEntry) {
            const defaultEntries = {};
            columns.forEach((column) => {
                const { name, data_type } = column;
    
                if (data_type === 'number') {
                    defaultEntries[name] = 0; // Default number type
                } else if (data_type === 'date') {
                    defaultEntries[name] = formatDateTime(new Date()); // Default date
                } else if (data_type === 'multiple choice') {
                    defaultEntries[name] = 'Select'; // Default dropdown
                } else {
                    defaultEntries[name] = ''; // Default text
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
            const { name, data_type, required_field } = column;
            const value = userEntries[name];

            if (data_type === 'number' && (value === '' || isNaN(value))) {
                notify(Type.error, `The field "${name}" must be a valid number.`);
                return false;
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
        }

        return true;
    };

    const submitEntry = async () => {
        if (!validEntries()) return;
    
        const formattedEntries = { ...userEntries };
    
        
        columnsCollection.forEach((column) => {
            const { name, data_type } = column;
    
            if (data_type === 'number') {
                formattedEntries[name] = Number(formattedEntries[name]) || 0; // Ensure number
            } else if (data_type === 'date') {
                formattedEntries[name] = new Date(formattedEntries[name]).toISOString(); // Ensure date format
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
                onEntryUpdated();
            }
        } catch (error) {
            console.error("Error saving entry:", error);
            notify(Type.error, "Failed to save entry.");
        }
    };
    

    const renderDynamicInputs = () => {
        const sortedColumns = [...columnsCollection].sort((a, b) => a.order - b.order);
    
        return sortedColumns.map((column, index) => {
            const { name, data_type, entry_options, required_field } = column;
    
            if (data_type === 'multiple choice') {
                return (
                    <DropdownSelector
                        key={index}
                        label={name}
                        options={['Select', ...entry_options]}
                        selection={userEntries[name] || ''}
                        setSelection={(selectedOption) => handleInputChange(name, selectedOption)}
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
