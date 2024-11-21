import React, { useEffect, useState } from 'react';
import { DropdownFlex, RadioButtons, YesNoSelector } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';

export default function ColumnOptions({
    ColumnNames,
    CancelColumnOptions,
    OpenNewTab,
    Email,
    SelectedProject,
    TabName,
    GenerateIdentifiers,
    PossibleIdentifiers,
    IdentifierDimension,
    UnwantedCodes,
    UtilizeUnwantedCodes,
}) {
    const [leftButtonClick, setLeftButtonClick] = useState();
    const [rightButtonText, setRightButtonText] = useState('');
    const [rightButtonClick, setRightButtonClick] = useState();

    const [columnIndex, setColumnIndex] = useState(0);
    const [entryType, setEntryType] = useState('');
    const [entryChoices, setEntryChoices] = useState([]);
    const [identifierDomain, setIdentifierDomain] = useState(false);
    const [domainList, setDomainList] = useState([]);
    const [columnSettings, setColumnSettings] = useState([]);

    useEffect(() => {
        if (columnIndex === 0) {
            setLeftButtonClick(() => CancelColumnOptions);
        } else {
            setLeftButtonClick(() => goBackward);
        }

        if (columnIndex === ColumnNames.length - 1) {
            setRightButtonText('Finish');
            setRightButtonClick(() => storeNewTab);
        } else {
            setRightButtonText('Next Column');
            setRightButtonClick(() => goForward);
        }
        console.log(domainList);
    }, [columnIndex, entryType, identifierDomain]);

    const storeNewTab = () => {
        if (validInputs) {
        }
    };

    const goBackward = () => {
        setColumnIndex((prevIndex) => {
            const newIndex = prevIndex - 1;

            const previousSettings = columnSettings[newIndex];
            if (previousSettings) {
                const [name, value] = Array.from(previousSettings.entries())[0];

                if (value !== 'text' && value !== 'number') {
                    setEntryType(entryTypeOptions[2]);
                    setEntryChoices(Array.isArray(value) ? value : []);
                } else if (value === 'text') {
                    setEntryType(entryTypeOptions[1]);
                    setEntryChoices([]);
                } else if (value === 'number') {
                    setEntryType(entryTypeOptions[0]);
                    setEntryChoices([]);
                }

                setIdentifierDomain(domainList.includes(ColumnNames[newIndex]));

            } else {
                setEntryType('');
                setEntryChoices([]);
                setIdentifierDomain(false);
            }

            return newIndex;
        });
    };

    const goForward = () => {
        setColumnIndex((prevIndex) => {
            const newIndex = prevIndex + 1;

            if (columnSettings[newIndex]) {
                const nextSettings = columnSettings[newIndex];
                if (nextSettings) {
                    const [name, value] = Array.from(nextSettings.entries())[0];

                    if (value !== 'text' && value !== 'number') {
                        setEntryType(entryTypeOptions[2]);
                        setEntryChoices(Array.isArray(value) ? value : []);
                    } else if (value === 'text') {
                        setEntryType(entryTypeOptions[1]);
                        setEntryChoices([]);
                    } else if (value === 'number') {
                        setEntryType(entryTypeOptions[0]);
                        setEntryChoices([]);
                    }
                }
                setIdentifierDomain(domainList.includes(ColumnNames[newIndex]));
            } else {
                if (validInputs()) {
                    let keyValue = '';
                    if (entryType === entryTypeOptions[0]) {
                        keyValue = 'number';
                    } else if (entryType === entryTypeOptions[1]) {
                        keyValue = 'text';
                    } else {
                        keyValue = entryChoices;
                    }

                    const newColumnMap = new Map().set(ColumnNames[prevIndex], keyValue);
                    setColumnSettings((prevSettings) => {
                        const updatedSettings = [...prevSettings];
                        updatedSettings[columnIndex] = newColumnMap;
                        return updatedSettings;
                    });

                    if (identifierDomain) {
                        setDomainList((previousNames) => {
                            if (!previousNames.includes(ColumnNames[prevIndex])) {
                                return [...previousNames, ColumnNames[prevIndex]];
                            }
                            return previousNames;
                        });
                    }
                    setEntryType('');
                    setIdentifierDomain(false);
                }
            }
            return newIndex;
        });
    };

    const validInputs = () => {
        if (!entryTypeOptions.includes(entryType)) {
            notify(Type.error, 'Must first select an entry type.');
            return false;
        } else {
            if (entryType === entryTypeOptions[2]) {
                if (!entryChoices) {
                    notify(Type.error, 'Must include entry options for multiple choice entry.');
                    return false;
                }
                if (entryChoices.length !== new Set(entryChoices).size) {
                    notify(Type.error, 'Entry choices must not contain duplicates.');
                    return false;
                }
            }
        }
        return true;
    };

    const entryTypeOptions = ['Numerical Entry', 'Text Entry', 'Multiple Choice Entry'];

    return (
        <WindowWrapper
            header="Column Options"
            onLeftButton={leftButtonClick}
            onRightButton={rightButtonClick}
            leftButtonText="Go Back"
            rightButtonText={rightButtonText}
        >
            <div className="flex flex-col space-y-4">
                <InputLabel
                    label="Column Name"
                    layout="horizontal-single"
                    input={<input disabled={true} value={ColumnNames[columnIndex]} />}
                />
                <RadioButtons
                    layout="horizontal"
                    options={entryTypeOptions}
                    selectedOption={entryType}
                    setSelectedOption={setEntryType}
                />
                {entryType === entryTypeOptions[2] && (
                    <DropdownFlex
                        options={entryChoices}
                        setOptions={setEntryChoices}
                        label={'Entry Choices'}
                    />
                )}
                <YesNoSelector
                    label="Add Column to Identifier Domain"
                    layout="horizontal-start"
                    selection={identifierDomain}
                    setSelection={setIdentifierDomain}
                />
            </div>
        </WindowWrapper>
    );
}
