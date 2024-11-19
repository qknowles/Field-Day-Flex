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
    UtilizeUnwantedCodes
}) {
    const [leftButtonClick, setLeftButtonClick] = useState();
    const [rightButtonText, setRightButtonText] = useState('');
    const [rightButtonClick, setRightButtonClick] = useState();

    const [columnIndex, setColumnIndex] = useState(0);
    const [columnName, setColumnName] = useState('');
    const [entryType, setEntryType] = useState();
    const [entryChoices, setEntryChoices] = useState([]);
    const [identifierDomain, setIdentifierDomain] = useState();
    const [columnSettings, setColumnSettings] = useState([]);


    useEffect(() => {
        if (columnIndex === 0) {
            setLeftButtonClick(() => CancelColumnOptions);
        } else {
            setLeftButtonClick(() => goBackward);
        }

        console.log(ColumnNames);
        if (columnIndex === ColumnNames.length - 1) {
            setRightButtonText('Finish');
            setRightButtonClick(() => storeNewTab);
        } else {
            setRightButtonText('Next Column');
            setRightButtonClick(() => goForward);
        }

        setColumnName(ColumnNames[columnIndex]);

    }, [columnIndex])

    const storeNewTab = () => {

    }

    const goBackward = () => {

    }

    const goForward = () => {

    }

    const entryOptions = ['Numerical Entry', 'Text Entry', 'Multiple Choice Entry'];

    return (
        <WindowWrapper
            header="Column Options"
            onLeftButton={leftButtonClick}
            onRightButton={rightButtonClick}
            leftButtonText='Go Back'
            rightButtonText={rightButtonText}
        >
            <div className="flex flex-col space-y-4">
                <InputLabel
                    label="Column Name"
                    layout="horizontal-single"
                    input={
                        <input
                            type="text"
                            value={columnName}
                            onChange={(e) => {
                                setColumnName(e.target.value);
                            }}
                        />
                    }
                />
                <RadioButtons
                layout='horizontal'
                options={entryOptions}
                selectedOption={entryType}
                setSelectedOption={setEntryType}
                />
                {(entryType === entryOptions[2]) && (
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
