import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { DropdownFlex, RadioButtons, YesNoSelector } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';
import { tabExists, createTab, addColumn } from '../utils/firestore';
import { useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';
import { entryTypeOptions } from '../utils/globals.js';
import InfoIcon from '../components/InfoIcon';

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
    const [allowNegative, setAllowNegative] = useState(new Array(ColumnNames.length).fill(false));
    const [duplicateColumns, setDuplicateColumns] = useState([]);

    const entryTypeOptionsArray = Object.values(entryTypeOptions).filter(
        (option) => option !== entryTypeOptions.AUTO_ID
    );

    const checkDuplicateNames = (names) => {
        const normalized = names.map(name => name?.trim().toLowerCase()).filter(Boolean);
        const nameCounts = normalized.reduce((acc, name) => {
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});
        const duplicates = normalized
            .map((name, i) => (name && nameCounts[name] > 1 ? i : null))
            .filter(i => i !== null);

        setDuplicateColumns(duplicates);
        return duplicates.length === 0;
    };

    const validInputs = useCallback((direction, overrideEntryOptions = entryOptions) => {
        if (!entryTypeOptionsArray.includes(dataType[columnIndex]) && direction !== 'goBackward') {
            notify(Type.error, 'Must first select an entry type.');
            return false;
        }

        if (dataType[columnIndex] === entryTypeOptions.MULTIPLE_CHOICE) {
            let currentOptions = overrideEntryOptions[columnIndex] || [];
            currentOptions = currentOptions.filter(
                (opt) => opt.trim() !== '' && opt.trim().toLowerCase() !== 'add here'
            );

            const uniqueOptions = new Set(currentOptions);
            if (currentOptions.length < 2 || uniqueOptions.size < 2) {
                notify(Type.error, 'Multiple choice must have at least two unique options.');
                return false;
            }
        }

        if (!ColumnNames[columnIndex] || ColumnNames[columnIndex].trim() === '') {
            notify(Type.error, "Column name can't be empty.");
            return false;
        }

        const isUnique = checkDuplicateNames(ColumnNames);
        if (!isUnique) {
            notify(Type.error, "Each column must have a unique name.");
            return false;
        }

        return true;
    }, [columnIndex, dataType, entryOptions, entryTypeOptionsArray, ColumnNames]);

    const getUpdatedEntryOptions = () => {
        return entryOptions.map((option, i) =>
            i === columnIndex && dataType[columnIndex] === entryTypeOptions.MULTIPLE_CHOICE ? [...tempEntryOptions] : option
        );
    };

    const goBackward = useCallback(() => {
        const updatedEntryOptions = getUpdatedEntryOptions();
        if (validInputs('goBackward', updatedEntryOptions)) {
            setEntryOptions(updatedEntryOptions);
            setColumnIndex(prev => prev - 1);
        }
    }, [columnIndex, tempEntryOptions, entryOptions, validInputs]);

    const goForward = useCallback(() => {
        const updatedEntryOptions = getUpdatedEntryOptions();
        if (validInputs(undefined, updatedEntryOptions)) {
            setEntryOptions(updatedEntryOptions);
            setColumnIndex(prev => prev + 1);
        }
    }, [columnIndex, tempEntryOptions, entryOptions, validInputs]);

    const isTabBeingCreated = useRef(false);

    const storeNewTab = useCallback(async () => {
        if (isTabBeingCreated.current) return;
        isTabBeingCreated.current = true;

        try {
            const updatedEntryOptions = getUpdatedEntryOptions();
            if (!validInputs(undefined, updatedEntryOptions)) return;

            const finalEntryOptions = updatedEntryOptions.map((opts) =>
                opts.filter((name) => name !== 'Add Here')
            );

            const isUnique = checkDuplicateNames(ColumnNames);
            if (!isUnique) {
                notify(Type.error, 'Please resolve duplicate column names before submitting.');
                return;
            }

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
                        allowNegative[i],
                    );
                    if (columnAdded.success === false) {
                        notify(Type.error, columnAdded.error || 'Error adding columns.');
                        return;
                    }
                }
                notify(Type.success, 'Columns added successfully.');
                OpenNewTab(TabName);
            } else {
                notify(Type.error, 'Error creating new tab.');
            }
        } finally {
            isTabBeingCreated.current = false;
        }
    }, [ColumnNames, Email, SelectedProject, TabName, dataType, entryOptions, tempEntryOptions, identifierDomain, requiredField, allowNegative, OpenNewTab, validInputs, generateIdentifiers, possibleIdentifiers, identifierDimension, unwantedCodes, utilizeUnwantedCodes]);

    const leftButtonClick = useMemo(() =>
        columnIndex === 0 ? CancelColumnOptions : goBackward,
        [columnIndex, CancelColumnOptions, goBackward]
    );

    const rightButtonClick = useMemo(() =>
        columnIndex === ColumnNames.length - 1 ? storeNewTab : goForward,
        [columnIndex, storeNewTab, goForward, ColumnNames]
    );

    const handleColumnNameChange = (newName) => {
        const updatedColumnNames = [...ColumnNames];
        updatedColumnNames[columnIndex] = newName;
        SetColumnNames(updatedColumnNames);
        checkDuplicateNames(updatedColumnNames);
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
                <div className="flex items-center">
                    <InputLabel
                        label="Column Name"
                        layout="horizontal-single"
                        input={
                            <>
                                <input
                                    value={ColumnNames[columnIndex]}
                                    onChange={(e) => handleColumnNameChange(e.target.value)}
                                    className={`border rounded px-2 py-1 w-full ${duplicateColumns.includes(columnIndex) ? 'border-red-500' : ''
                                        }`}
                                />
                                {duplicateColumns.includes(columnIndex) && (
                                    <div className="text-red-500 text-sm ml-1 mt-1">
                                        Column name must be unique.
                                    </div>
                                )}
                            </>
                        }
                    />
                    <InfoIcon
                        text="Enter a descriptive name for this column. This name will be visible in the data table headers."
                        position="right"
                        className="ml-2"
                    />
                </div>

                <div className="flex items-center">
                    <span className="text-sm">Data Entry Type:</span>
                    <InfoIcon
                        text="Select the type of data this column will store. This affects validation, formatting, and how users can interact with it."
                        position="top"
                        className="ml-2"
                        size={14}
                    />
                </div>

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
                    <div className="mt-2">
                        <div className="flex items-center mb-2">
                            <span className="text-sm">Entry Choices:</span>
                            <InfoIcon
                                text="Add the options users can select from. Click 'Add Here' to add a new option. At least two unique options are required."
                                position="right"
                                className="ml-2"
                                size={14}
                            />
                        </div>
                        <DropdownFlex
                            options={tempEntryOptions}
                            setOptions={setTempEntryOptions}
                            label="Entry Choices"
                        />
                    </div>
                )}

                {(dataType[columnIndex] === entryTypeOptions.INTEGER || dataType[columnIndex] === entryTypeOptions.DECIMAL) && (
                    <YesNoSelector
                        label="Allow negative values?"
                        layout="horizontal-start"
                        selection={allowNegative[columnIndex]}
                        setSelection={(val) => setAllowNegative((prev) => {
                            const updated = [...prev];
                            updated[columnIndex] = val;
                            return updated;
                        })}
                    />
                )}

                <YesNoSelector
                    label="Make column a required field"
                    layout="horizontal-start"
                    selection={requiredField[columnIndex]}
                    setSelection={(val) => setRequiredField((prev) => {
                        const updated = [...prev];
                        updated[columnIndex] = val;
                        return updated;
                    })}
                />

                <YesNoSelector
                    label="Include column in entry ID domain"
                    layout="horizontal-start"
                    selection={identifierDomain[columnIndex]}
                    setSelection={(val) => setIdentifierDomain((prev) => {
                        const updated = [...prev];
                        updated[columnIndex] = val;
                        return updated;
                    })}
                />
            </div>
        </WindowWrapper>
    );
}
