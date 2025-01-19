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
        loadCollection();
    }, [ProjectName, Email]);

    const loadCollection = async () => {
        const columns = await getColumnsCollection(ProjectName, TabName, Email);
        setColumnsCollection(columns);

        const defaultEntries = {};
        columns.forEach((column) => {
            const { name, data_type } = column;
            if (data_type === 'date') {
                defaultEntries[name] = new Date().toISOString().split('T')[0];
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

    const validEntries = () => {
        for (const column of columnsCollection) {
            const { name, data_type } = column;
            const value = userEntries[name];

            if (data_type === 'number' && (value === '' || isNaN(value))) {
                notify(Type.error, `The field "${name}" must be a valid number.`);
                return false;
            }

            if (data_type === 'date' && isNaN(Date.parse(value))) {
                notify(Type.error, `The field "${name}" must be a valid date.`);
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
        return columnsCollection.map((column, index) => {
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
                data_type === 'number' ? 'number' : data_type === 'date' ? 'date' : 'text';

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
                            value={userEntries[name]}
                            onChange={(e) => handleInputChange(name, e.target.value)}
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
