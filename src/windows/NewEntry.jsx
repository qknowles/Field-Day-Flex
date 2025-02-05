import React, { useState, useEffect } from 'react';
import { DropdownSelector } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { getColumnsCollection, addEntry } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';

export default function NewEntry({ CloseNewEntry, ProjectName, TabName, Email }) {
    const [columnsCollection, setColumnsCollection] = useState([]);
    const [userEntries, setUserEntries] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            await loadCollection();
        };
        fetchData();
    }, [ProjectName, TabName, Email]);

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

    const loadCollection = async () => {
        const columns = await getColumnsCollection(ProjectName, TabName, Email);
        setColumnsCollection(columns);

        const defaultEntries = {};
        columns.forEach((column) => {
            const { name, data_type } = column;
            if (data_type === 'date') {
                defaultEntries[name] = formatDateTime(new Date());
            } else if (data_type === 'multiple choice') {
                defaultEntries[name] = 'Select';
            } else {
                defaultEntries[name] = '';
            }
        });
        setUserEntries(defaultEntries);
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
        }

        return true;
    };

    const submitEntry = async () => {
        if (validEntries()) {
            await addEntry(ProjectName, TabName, Email, userEntries);
            notify(Type.success, `Entry submitted.`);
            CloseNewEntry();
        }
    };

    const renderDynamicInputs = () => {
        // Ensure columns are sorted using the same `order` field as the table
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
                                handleInputChange(
                                    name,
                                    data_type === 'date' ? formatDateTime(value) : value,
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
            header="New Entry"
            onLeftButton={CloseNewEntry}
            onRightButton={submitEntry}
            leftButtonText="Cancel"
            rightButtonText="Submit Entry"
        >
            <div className="flex flex-col space-y-4">{renderDynamicInputs()}</div>
        </WindowWrapper>
    );
}
