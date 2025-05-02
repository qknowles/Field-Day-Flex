import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DropdownFlex, RadioButtons, YesNoSelector } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';
import { tabExists, createTab, addColumn } from '../utils/firestore';
import { useAtomValue } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';
import { entryTypeOptions } from '../utils/globals.js';
import InfoIcon from '../components/InfoIcon';
import { COLUMN_CONSTRAINTS, validateMaxLength, validateMinLength, getValidationError } from '../utils/fieldConstraints';

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
    const [yesNoOptions, setYesNoOptions] = useState([]);
    const [dataType, setDataType] = useState(new Array(ColumnNames.length).fill(''));
    const [entryOptions, setEntryOptions] = useState(Array.from({ length: ColumnNames.length }, () => []));
    const [identifierDomain, setIdentifierDomain] = useState(new Array(ColumnNames.length).fill(false));
    const [requiredField, setRequiredField] = useState(new Array(ColumnNames.length).fill(false));
    const [allowNegative, setAllowNegative] = useState(new Array(ColumnNames.length).fill(false));

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

        // Validate column name length
        const validationError = getValidationError(
            'Column name', 
            ColumnNames[columnIndex], 
            COLUMN_CONSTRAINTS.NAME_MIN_LENGTH, 
            COLUMN_CONSTRAINTS.NAME_MAX_LENGTH
        );
        
        if (validationError && direction !== 'goBackward') {
            notify(Type.error, validationError);
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

            // Check if any option exceeds maximum length
            for (const option of currentOptions) {
                if (option.length > COLUMN_CONSTRAINTS.ENTRY_OPTION_MAX_LENGTH) {
                    notify(Type.error, `Option "${option}" exceeds maximum length of ${COLUMN_CONSTRAINTS.ENTRY_OPTION_MAX_LENGTH} characters.`);
                    return false;
                }
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
                        allowNegative[i],
                    );
                    if (!columnAdded) {
                        notify(Type.error, 'Error adding columns.');
                        return;
                    }
                }
            } else {
                notify(Type.error, 'Error creating new tab.');
                return;
            }
            
            notify(Type.success, 'Columns added successfully.');
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
        generateIdentifiers,
        possibleIdentifiers,
        identifierDimension,
        unwantedCodes,
        utilizeUnwantedCodes
    ]);

    const leftButtonClick = useMemo(() => {
        return columnIndex === 0 ? CancelColumnOptions : goBackward;
    }, [columnIndex, CancelColumnOptions, goBackward]);

    const rightButtonClick = useMemo(() => {
        return columnIndex === ColumnNames.length - 1 ? storeNewTab : goForward;
    }, [columnIndex, storeNewTab, goForward, ColumnNames]);

    const handleColumnNameChange = (newName) => {
        // Enforce maximum length here to handle edge cases
        if (newName.length > COLUMN_CONSTRAINTS.NAME_MAX_LENGTH) {
            newName = newName.substring(0, COLUMN_CONSTRAINTS.NAME_MAX_LENGTH);
        }
        
        const updatedColumnNames = [...ColumnNames];
        updatedColumnNames[columnIndex] = newName;
        SetColumnNames(updatedColumnNames);
    };

    useEffect(() => {
        setTempEntryOptions(entryOptions[columnIndex]);
        setRightButtonText(columnIndex === ColumnNames.length - 1 ? 'Finish' : 'Next Column');
    }, [columnIndex, ColumnNames.length, entryOptions]);

    // Calculate character count for column name
    const columnNameCharCount = ColumnNames[columnIndex]?.length || 0;
    const isColumnNameValid = ColumnNames[columnIndex] ? (
        validateMinLength(ColumnNames[columnIndex], COLUMN_CONSTRAINTS.NAME_MIN_LENGTH) && 
        validateMaxLength(ColumnNames[columnIndex], COLUMN_CONSTRAINTS.NAME_MAX_LENGTH)
    ) : false;

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
                            <div className="flex flex-col w-full">
                                <input
                                    value={ColumnNames[columnIndex]}
                                    onChange={(e) => handleColumnNameChange(e.target.value)}
                                    maxLength={COLUMN_CONSTRAINTS.NAME_MAX_LENGTH}
                                    className={!isColumnNameValid && ColumnNames[columnIndex] ? "border-red-500" : ""}
                                />
                                <div className={`text-xs mt-1 ${
                                    !isColumnNameValid && ColumnNames[columnIndex] ? "text-red-500" : "text-neutral-500"
                                }`}>
                                    {columnNameCharCount}/{COLUMN_CONSTRAINTS.NAME_MAX_LENGTH} characters
                                    {ColumnNames[columnIndex] && !validateMinLength(ColumnNames[columnIndex], COLUMN_CONSTRAINTS.NAME_MIN_LENGTH) && 
                                        ` (min: ${COLUMN_CONSTRAINTS.NAME_MIN_LENGTH})`}
                                </div>
                            </div>
                        }
                    />
                    <InfoIcon 
                        text={`Enter a descriptive name for this column (${COLUMN_CONSTRAINTS.NAME_MIN_LENGTH}-${COLUMN_CONSTRAINTS.NAME_MAX_LENGTH} characters). This name will be visible in the data table headers.`}
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
                                text={`Add the options users can select from (max ${COLUMN_CONSTRAINTS.ENTRY_OPTION_MAX_LENGTH} characters each). Click 'Add Here' to add a new option. At least two unique options are required.`}
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

                <div className="flex items-center space-x-2">
                    {(dataType[columnIndex] === entryTypeOptions.INTEGER ||
                    dataType[columnIndex] === entryTypeOptions.DECIMAL) && (
                        <YesNoSelector
                            label="Allow negative values?"
                            layout="horizontal-start"
                            selection={allowNegative[columnIndex]}
                            setSelection={(selection) =>
                               setAllowNegative((prev) => {
                                  const updated = [...prev];
                                  updated[columnIndex] = selection;
                                  return updated;
                               })
                            }
                       />
                       
                    )}
                    <InfoIcon
                        text="When set to Yes, users will be allowed to use negative values for their number type entries."
                        position="right"
                        className="ml-2"
                    />
                </div>

                <div className="flex items-center space-x-2">
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
                    <InfoIcon
                        text="When set to Yes, users must provide a value for this field before saving an entry."
                        position="right"
                        className="ml-2"
                    />
                </div>
               
                <div className="flex items-center space-x-2">
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
                   <InfoIcon 
                        text="If enabled, this field will be used when generating unique identifiers for entries. Useful for creating structured IDs based on field values."
                        position="right"
                        className="ml-2"
                        width={250}
                    />
               </div>

            </div>
        </WindowWrapper>
    );
}