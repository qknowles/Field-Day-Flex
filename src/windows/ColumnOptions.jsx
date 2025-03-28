import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DropdownFlex, RadioButtons, YesNoSelector } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';
import { tabExists, createTab, addColumn } from '../utils/firestore';
import { useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';
import { entryTypeOptions } from '../utils/globals.js';

export default function ColumnOptions({
    ColumnNames,
    SetColumnNames,
    CancelColumnOptions,
    OpenNewTab,
    tabName = '',
    header = 'Column Options',
    generateIdentifiers,
    possibleIdentifiers,
    identifierDimension,
    unwantedCodes,
    utilizeUnwantedCodes,
}) {

    const SelectedProject = useAtomValue(currentProjectName);
    const TabName = tabName || useAtomValue(currentTableName);
    const Email = useAtomValue(currentUserEmail);

    const [rightButtonText, setRightButtonText] = useState('Next Column');
    const [columnIndex, setColumnIndex] = useState(0);
    const [tempEntryOptions, setTempEntryOptions] = useState([]);
    const [dataType, setDataType] = useState(new Array(ColumnNames.length).fill(''));
    const [entryOptions, setEntryOptions] = useState(Array.from({ length: ColumnNames.length }, () => []));
    const [identifierDomain, setIdentifierDomain] = useState(new Array(ColumnNames.length).fill(false));
    const [requiredField, setRequiredField] = useState(new Array(ColumnNames.length).fill(false));

    // Create an array of options for components that need a list.
    const entryTypeOptionsArray = Object.values(entryTypeOptions).filter(
        (option) => option !== entryTypeOptions.AUTO_ID
    );

    /**
     * This validation function now accepts an override for the entryOptions
     * so that we can pass in an updated copy that includes tempEntryOptions.
     */
    const validInputs = useCallback((direction, overrideEntryOptions = entryOptions) => {
        // Validate that a proper entry type was selected unless going backward.
        if (!entryTypeOptionsArray.includes(dataType[columnIndex]) && direction !== 'goBackward') {
            notify(Type.error, 'Must first select an entry type.');
            return false;
        }

        // If it's a multiple choice, ensure we have entry options.
        if (dataType[columnIndex] === entryTypeOptions.MULTIPLE_CHOICE) {
            let currentOptions = overrideEntryOptions[columnIndex] || [];
        
            // Filter out placeholder or empty string values
            currentOptions = currentOptions.filter(
                (opt) => opt.trim() !== '' && opt.trim().toLowerCase() !== 'add here'
            );
        
            const uniqueOptions = new Set(currentOptions);
        
            if (currentOptions.length < 2) {
                notify(Type.error, 'Must include at least two valid entry options for multiple choice entry.');
                return false;
            }
        
            if (uniqueOptions.size < 2) {
                notify(Type.error, 'Entry choices must include at least two unique values.');
                return false;
            }
        }
        
        
        if (ColumnNames[columnIndex] === '' || ColumnNames[columnIndex] === null || ColumnNames[columnIndex] === undefined) {
            notify(Type.error, "Column name can't be empty.");
            return false;
        }

        return true;
    }, [columnIndex, dataType, entryOptions, entryTypeOptions, entryTypeOptionsArray, ColumnNames]);

    /**
     * Helper to compute updated entry options for the current column,
     * replacing its value with tempEntryOptions.
     */
    const getUpdatedEntryOptions = () => {
        if (dataType[columnIndex] === entryTypeOptions.MULTIPLE_CHOICE) {
            return entryOptions.map((option, i) =>
                i === columnIndex ? [...tempEntryOptions] : option
            );
        } else {
            return entryOptions.map((option, i) =>
                i === columnIndex ? [] : option
            );
        }
    };    

    const goBackward = useCallback(() => {
        const updatedEntryOptions = getUpdatedEntryOptions();
        if (validInputs('goBackward', updatedEntryOptions)) {
            setEntryOptions(updatedEntryOptions);
            setColumnIndex((prevIndex) => prevIndex - 1);
        }
    }, [columnIndex, tempEntryOptions, entryOptions, validInputs]);

    const goForward = useCallback(() => {
        const updatedEntryOptions = getUpdatedEntryOptions();
    
        if (validInputs(undefined, updatedEntryOptions)) {
            setEntryOptions(updatedEntryOptions);
            setColumnIndex((prevIndex) => prevIndex + 1);
        }
    }, [columnIndex, tempEntryOptions, entryOptions, validInputs]);
    

    const storeNewTab = useCallback(async () => {
        const updatedEntryOptions = getUpdatedEntryOptions();
        if (validInputs(undefined, updatedEntryOptions)) {
            let finalEntryOptions = updatedEntryOptions.map((options) =>
                options.filter((name) => name !== 'Add Here')
            );

            let tabAlreadyExists = await tabExists(Email, SelectedProject, TabName);

            if (!tabAlreadyExists) {
                let columnName = '';
                let columnDataType = '';
                let entryOptions = [];
                let columnIdentifierDomain = '';
                let columnRequiredField = '';
                let columnOrder = '';
                if (generateIdentifiers) {
                    columnName = 'Entry ID';
                    columnDataType = entryTypeOptions.AUTO_ID;
                    columnIdentifierDomain = true;
                    columnRequiredField = true;
                    columnOrder = 0;
                }

                const tabCreated = await createTab(
                    Email,
                    SelectedProject,
                    TabName,
                    generateIdentifiers,
                    possibleIdentifiers,
                    identifierDimension,
                    unwantedCodes,
                    utilizeUnwantedCodes,
                    columnName,
                    columnDataType,
                    entryOptions,
                    columnIdentifierDomain,
                    columnRequiredField,
                    columnOrder,
                );

                tabAlreadyExists = tabCreated;
            }

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
            } else {

                const tabCreated = await createTab(
                    Email,
                    SelectedProject,
                    cleanedTabName,
                    generateIdentifiers,
                    possibleIdentifiers,
                    identifierDimension,
                    unwantedCodesWithoutDuplicates,
                    utilizeUnwantedCodes,
                    columnName,
                    columnDataType,
                    entryOptions,
                    columnIdentifierDomain,
                    columnRequiredField,
                    columnOrder,
                );
                if (tabCreated) {
                    notify(Type.success, `Tab created.`);
                    OpenNewTab(cleanedTabName);
                    return;
                } else {
                    notify(Type.error, 'Error creating new tab.');
                    return;
                }
            }
            OpenNewTab(TabName);
        }
    }, [
        ColumnNames,
        Email,
        SelectedProject,
        TabName,
        dataType,
        entryOptions,
        tempEntryOptions,
        identifierDomain,
        requiredField,
        OpenNewTab,
        validInputs,
    ]);

    const leftButtonClick = useMemo(() => {
        return columnIndex === 0 ? CancelColumnOptions : goBackward;
    }, [columnIndex, CancelColumnOptions, goBackward]);

    const rightButtonClick = useMemo(() => {
        return columnIndex === ColumnNames.length - 1 ? storeNewTab : goForward;
    }, [columnIndex, storeNewTab, goForward, ColumnNames]);

    const handleColumnNameChange = (newName) => {
        const updatedColumnNames = [...ColumnNames];
        updatedColumnNames[columnIndex] = newName;
        SetColumnNames(updatedColumnNames);
    };

    useEffect(() => {
        setTempEntryOptions(entryOptions[columnIndex]);
        setRightButtonText(columnIndex === ColumnNames.length - 1 ? 'Finish' : 'Next Column');
    }, [columnIndex, ColumnNames.length, entryOptions]);

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
                    options={entryTypeOptionsArray}
                    selectedOption={dataType[columnIndex]}
                    setSelectedOption={(type) => {
                        setDataType((prev) => {
                            const updated = [...prev];
                            updated[columnIndex] = type;
                            return updated;
                        });
                    }}
                />
                {dataType[columnIndex] === entryTypeOptions.MULTIPLE_CHOICE && (
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