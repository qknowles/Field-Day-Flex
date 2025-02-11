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
    GenerateIdentifiers,
    PossibleIdentifiers,
    IdentifierDimension,
    UnwantedCodes,
    UtilizeUnwantedCodes,
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
    const [entryOptions, setEntryOptions] = useState(() =>
        Array.from({ length: ColumnNames.length }, () => []),
    );
    const [identifierDomain, setIdentifierDomain] = useState(
        new Array(ColumnNames.length).fill(false),
    );
    const [requiredField, setRequiredField] = useState(new Array(ColumnNames.length).fill(false));
    const [order, setOrder] = useState(Array.from({ length: ColumnNames.length }, (_, i) => i));

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

    const goBackward = useCallback(() => {
        setColumnIndex((prevIndex) => prevIndex - 1);
    }, []);

    const goForward = useCallback(() => {
        if (validInputs()) {
            setColumnIndex((prevIndex) => prevIndex + 1);
            setTempEntryOptions([]);
        }
    }, [validInputs]);

    const storeNewTab = useCallback(async () => {
        if (validInputs()) {
            const finalEntryOptions = Array.from({ length: ColumnNames.length }, (_, i) =>
                entryOptions[i].filter((name) => name !== 'Add Here'),
            );

            const tabAlreadyExists = await tabExists(Email, SelectedProject, TabName);
            if (!tabAlreadyExists) {
                const tabCreated = await createTab(
                    Email,
                    SelectedProject,
                    TabName,
                    GenerateIdentifiers,
                    PossibleIdentifiers,
                    IdentifierDimension,
                    UnwantedCodes,
                    UtilizeUnwantedCodes,
                    ColumnNames,
                    dataType,
                    finalEntryOptions,
                    identifierDomain,
                    requiredField,
                    order,
                );
                if (tabCreated) {
                    notify(Type.success, 'Tab created.');
                    OpenNewTab(TabName);
                } else {
                    notify(Type.error, 'Error creating subject.');
                }
                // This just identifies if ColumnOptions is being used to create a new tab vs just adding a column. See null values in TablePage.
            } else if (GenerateIdentifiers === null) {
                const columnAdded = await addColumn(
                    Email,
                    SelectedProject,
                    TabName,
                    ColumnNames,
                    dataType,
                    finalEntryOptions,
                    identifierDomain,
                    requiredField,
                );
                if (columnAdded) {
                    notify(Type.success, 'update tab');
                    OpenNewTab();
                } else {
                    notify(Type.error, 'Error creating new column.');
                }
            }
        }
    }, [
        validInputs,
        ColumnNames,
        Email,
        SelectedProject,
        TabName,
        GenerateIdentifiers,
        PossibleIdentifiers,
        IdentifierDimension,
        UnwantedCodes,
        UtilizeUnwantedCodes,
        entryOptions,
        dataType,
        identifierDomain,
        requiredField,
        order,
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
                        options={entryOptions[columnIndex]}
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
