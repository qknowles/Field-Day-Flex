import React, { useEffect, useState } from 'react';
import { DropdownFlex, DropdownSelector, YesNoSelector } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';
import { tabExists, createTab } from '../utils/firestore';
import ColumnOptions from './ColumnOptions.jsx';

export default function NewTab({ CancelTab, OpenNewTab, Email, SelectedProject }) {
    const [tabName, setTabName] = useState('');
    const [generateIdentifiers, setGenerateIdentifiers] = useState(false);
    const [possibleIdentifiers, setPossibleIdentifiers] = useState([]);
    const [identifierDimension, setIdentifierDimension] = useState([]);
    const [unwantedCodes, setUnwantedCodes] = useState([]);
    const [utilizeUnwantedCodes, setUtilizeUnwantedCodes] = useState(false);

    const [firstIdentifierDimension, setFirstIdentifierDimension] = useState('');
    const [secondIdentifierDimension, setSecondIdentifierDimension] = useState('');
    const [columnNames, setColumnNames] = useState([]);

    const dimensionsChar = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const dimensionsNum = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const [rightButtonText, setRightButtonText] = useState('Create');

    const [showColumnOptions, setShowColumnOptions] = useState(false);

    useEffect(() => {
        if (columnNames.length > 1) {
            setRightButtonText('Next Step');
        } else {
            setRightButtonText('Create');
        }
    }, [columnNames]);

    useEffect(() => {
        if (generateIdentifiers) {
            setIdentifierDimension([firstIdentifierDimension, secondIdentifierDimension]);
        }
    }, [firstIdentifierDimension, secondIdentifierDimension]);

    const returnPossibleIdentifiers = (highestLetter, highestNumber, unwanted) => {
        const identifiers = [];

        for (
            let charCode = 'A'.charCodeAt(0);
            charCode <= highestLetter.charCodeAt(0);
            charCode++
        ) {
            const letter = String.fromCharCode(charCode);

            for (let num = 1; num <= highestNumber; num++) {
                const identifier = `${letter}${num}`;

                if (!unwanted.includes(identifier)) {
                    identifiers.push(identifier);
                }
            }
        }
        return identifiers;
    };

    const continueTab = async () => {
        const codeRegex = /^[A-J](?:10|[1-9])$/;

        const filteredColumnNames = columnNames.filter((name) => name !== 'Add Here');
        const filteredUnwantedCodes = unwantedCodes.filter((code) => code !== 'Add Here');

        const unwantedCodesNoSpace = filteredUnwantedCodes.map((code) =>
            code.replace(/\s+/g, '').toUpperCase(),
        );
        const unwantedCodesWithoutDuplicates = Array.from(new Set([...unwantedCodesNoSpace]));
        const allCodesValid = unwantedCodesWithoutDuplicates.every((code) => codeRegex.test(code));
        if (!allCodesValid) {
            notify(
                Type.error,
                'Unwanted Codes must contain only one letter A-J and one number 1-10 without spaces.',
            );
            return;
        }

        const uniqueColumnNames = Array.from(new Set(filteredColumnNames));
        if (uniqueColumnNames.length !== filteredColumnNames.length) {
            notify(Type.error, 'Duplicate column names are not allowed.');
            return;
        }

        const cleanedTabName = tabName.trim();

        let finalPossibleIdentifiers = [];
        if (generateIdentifiers) {
            finalPossibleIdentifiers = returnPossibleIdentifiers(
                firstIdentifierDimension,
                secondIdentifierDimension,
                unwantedCodesWithoutDuplicates,
            );
        }

        setColumnNames(filteredColumnNames);
        setTabName(cleanedTabName);
        setPossibleIdentifiers(finalPossibleIdentifiers);
        setUnwantedCodes(unwantedCodesWithoutDuplicates);

        if (filteredColumnNames.length > 0) {
            setShowColumnOptions(true);
        } else {
            const tabAlreadyExists = await tabExists(Email, SelectedProject, tabName);
            if (!tabAlreadyExists) {
                const tabCreated = await createTab(
                    Email,
                    SelectedProject,
                    cleanedTabName,
                    generateIdentifiers,
                    finalPossibleIdentifiers,
                    identifierDimension,
                    unwantedCodesWithoutDuplicates,
                    utilizeUnwantedCodes,
                );
                if (tabCreated) {
                    notify(Type.success, `Tab created.`);
                    OpenNewTab(tabName);
                    return;
                } else {
                    notify(Type.error, 'Error creating new tab.');
                    return;
                }
            } else {
                notify(Type.error, 'Tab already exists.');
            }
        }
    };

    const closeColumnOptions = () => {
        setShowColumnOptions(false);
    };

    return (
        <>
            {showColumnOptions ? (
                <ColumnOptions
                    ColumnNames={columnNames}
                    SetColumnNames={setColumnNames}
                    CancelColumnOptions={closeColumnOptions}
                    OpenNewTab={OpenNewTab}
                    Email={Email}
                    SelectedProject={SelectedProject}
                    TabName={tabName}
                    GenerateIdentifiers={generateIdentifiers}
                    PossibleIdentifiers={possibleIdentifiers}
                    IdentifierDimension={identifierDimension}
                    UnwantedCodes={unwantedCodes}
                    UtilizeUnwantedCodes={utilizeUnwantedCodes}
                />
            ) : (
                <WindowWrapper
                    header="New Subject"
                    onLeftButton={CancelTab}
                    onRightButton={continueTab}
                    leftButtonText="Cancel"
                    rightButtonText={rightButtonText}
                >
                    <div className="flex flex-col space-y-4">
                        <InputLabel
                            label="Subject Name"
                            layout="horizontal-single"
                            input={
                                <input
                                    type="text"
                                    value={tabName}
                                    onChange={(e) => {
                                        setTabName(e.target.value);
                                    }}
                                />
                            }
                        />
                        <DropdownFlex
                            options={columnNames}
                            setOptions={setColumnNames}
                            label={'Column Names'}
                        />
                        <YesNoSelector
                            label="Generate Identifiers"
                            layout="horizontal-start"
                            selection={generateIdentifiers}
                            setSelection={setGenerateIdentifiers}
                        />
                        {generateIdentifiers && (
                            <>
                                <div className="flex space-x-2">
                                    <DropdownSelector
                                        label="Max Dimension"
                                        options={dimensionsChar}
                                        selection={firstIdentifierDimension}
                                        setSelection={setFirstIdentifierDimension}
                                        layout={'horizontal'}
                                    />
                                    <DropdownSelector
                                        label="By"
                                        options={dimensionsNum}
                                        selection={secondIdentifierDimension}
                                        setSelection={setSecondIdentifierDimension}
                                    />
                                </div>
                                <div className="flex flex-col space-y-4">
                                    <DropdownFlex
                                        options={unwantedCodes}
                                        setOptions={setUnwantedCodes}
                                        label="Unwanted Codes"
                                    />
                                    <YesNoSelector
                                        label="Utilize Unwanted Code"
                                        selection={utilizeUnwantedCodes}
                                        setSelection={setUtilizeUnwantedCodes}
                                        layout={'horizontal-start'}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </WindowWrapper>
            )}
        </>
    );
}
