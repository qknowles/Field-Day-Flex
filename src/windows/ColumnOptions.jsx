import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DropdownFlex, RadioButtons, YesNoSelector } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';
import { tabExists, createTab, addColumn } from '../utils/firestore';
import { useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';

export default function ColumnOptions({
    ColumnNames,
    SetColumnNames,
    CancelColumnOptions,
    OpenNewTab,
    tabName = '',
    header = 'Column Options',
}) {

    const SelectedProject = useAtomValue(currentProjectName);
    const storedTabName = useAtomValue(currentTableName);
    const TabName = tabName || storedTabName;
    const Email = useAtomValue(currentUserEmail);

    const [rightButtonText, setRightButtonText] = useState('Next Column');
    const [columnIndex, setColumnIndex] = useState(0);
    const [tempEntryOptions, setTempEntryOptions] = useState([]);
    const [dataType, setDataType] = useState(new Array(ColumnNames.length).fill(''));
    const [entryOptions, setEntryOptions] = useState(Array.from({ length: ColumnNames.length }, () => []));
    const [identifierDomain, setIdentifierDomain] = useState(new Array(ColumnNames.length).fill(false));
    const [requiredField, setRequiredField] = useState(new Array(ColumnNames.length).fill(false));

    const entryTypeOptions = ['number', 'text', 'date', 'multiple choice'];

    const validInputs = useCallback(() => {
        if (!entryTypeOptions.includes(dataType[columnIndex])) {
            notify(Type.error, 'Must first select an entry type.');
            return false;
        }

        if (dataType[columnIndex] === entryTypeOptions[3]) {
            if (!entryOptions[columnIndex]) {
                notify(Type.error, 'Must include entry options for multiple choice entry.');
                return false;
            }
            if (entryOptions[columnIndex].length !== new Set(entryOptions[columnIndex]).size) {
                notify(Type.error, 'Entry choices must not contain duplicates.');
                return false;
            }
        }
        return true;
    }, [columnIndex, dataType, entryOptions, entryTypeOptions]);

    const storeEntryOptions = useCallback(() => {
        setEntryOptions((prevOptions) =>
            prevOptions.map((option, i) =>
                i === columnIndex ? [...tempEntryOptions] : option
            )
        );
    }, [tempEntryOptions, columnIndex]);

    const goBackward = useCallback(() => {
        if (validInputs()) {
            storeEntryOptions();
            setColumnIndex((prevIndex) => prevIndex - 1);
        }
    }, [validInputs]);

    const goForward = useCallback(() => {
        if (validInputs()) {
            storeEntryOptions();
            setColumnIndex((prevIndex) => prevIndex + 1);
        }
    }, [validInputs]);

    const storeNewTab = useCallback(async () => {
        if (validInputs()) {
            let finalEntryOptions = entryOptions.map((option, i) =>
                i === columnIndex ? [...tempEntryOptions] : option
            );
            
            finalEntryOptions = finalEntryOptions.map((options) =>
                options.filter((name) => name !== 'Add Here')
            );
    
            const tabAlreadyExists = await tabExists(Email, SelectedProject, TabName);
            if (tabAlreadyExists) {
                for (let i = 0; i < ColumnNames.length; i++) {
                    const columnAdded = await addColumn(
                        Email,
                        SelectedProject,
                        TabName,
                        ColumnNames[i],
                        dataType[i],
                        finalEntryOptions[i],
                        identifierDomain[i],
                        requiredField[i],
                    );
                    if (!columnAdded) {
                        notify(Type.error, 'Error adding columns.');
                        return;
                    }
                }
            }
            OpenNewTab(TabName);
        }
    }, [
        validInputs,
        ColumnNames,
        Email,
        SelectedProject,
        TabName,
        entryOptions,
        tempEntryOptions,
        dataType,
        identifierDomain,
        requiredField,
        OpenNewTab,
    ]);

    const leftButtonClick = useMemo(() => {
        return columnIndex === 0 ? CancelColumnOptions : goBackward;
    }, [columnIndex, CancelColumnOptions, goBackward]);

    const rightButtonClick = useMemo(() => {
        return columnIndex === ColumnNames.length - 1 ? storeNewTab : goForward;
    }, [columnIndex, storeNewTab, goForward]);

    const handleColumnNameChange = (newName) => {
        const updatedColumnNames = [...ColumnNames];
        updatedColumnNames[columnIndex] = newName;
        SetColumnNames(updatedColumnNames);
    };

    useEffect(() => {
        setTempEntryOptions(entryOptions[columnIndex]);
        setRightButtonText(columnIndex === ColumnNames.length - 1 ? 'Finish' : 'Next Column');
    }, [columnIndex, ColumnNames.length]);

    return (
        <WindowWrapper
            header={header}
            onLeftButton={leftButtonClick}
            onRightButton={rightButtonClick}
            leftButtonText="Go Back"
            rightButtonText={rightButtonText}
        >
            <div className="flex flex-col space-y-4">
                <InputLabel
                    label="Column Name"
                    layout="horizontal-single"
                    input={
                        <input
                            value={ColumnNames[columnIndex]}
                            onChange={(e) => handleColumnNameChange(e.target.value)}
                        />
                    }
                />
                <span className="text-sm">Data Entry Type:</span>
                <RadioButtons
                    layout="horizontal"
                    options={entryTypeOptions}
                    selectedOption={dataType[columnIndex]}
                    setSelectedOption={(type) => {
                        setDataType((prev) => {
                            const updated = [...prev];
                            updated[columnIndex] = type;
                            return updated;
                        });
                    }}
                />
                {dataType[columnIndex] === entryTypeOptions[3] && (
                    <DropdownFlex
                        options={tempEntryOptions}
                        setOptions={setTempEntryOptions}
                        label="Entry Choices"
                    />
                )}
                <YesNoSelector
                    label="Make column a required field"
                    layout="horizontal-start"
                    selection={requiredField[columnIndex]}
                    setSelection={(selection) =>
                        setRequiredField((prev) => {
                            const updated = [...prev];
                            updated[columnIndex] = selection;
                            return updated;
                        })
                    }
                />
                <YesNoSelector
                    label="Include column in entry ID domain"
                    layout="horizontal-start"
                    selection={identifierDomain[columnIndex]}
                    setSelection={(selection) =>
                        setIdentifierDomain((prev) => {
                            const updated = [...prev];
                            updated[columnIndex] = selection;
                            return updated;
                        })
                    }
                />
            </div>
        </WindowWrapper>
    );
}
