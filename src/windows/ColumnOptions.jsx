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

    const [dataType, setDataType] = useState(new Array(ColumnNames.length).fill(''));
    const [entryOptions, setEntryOptions] = useState([]);
    const [identifierDomain, setIdentifierDomain] = useState(
        new Array(ColumnNames.length).fill(false),
    );
    const [requiredField, setRequiredField] = useState(new Array(ColumnNames.length).fill(false));
    const [order, setOrder] = useState(Array.from({ length: ColumnNames.length }, (_, i) => i));

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
    }, [columnIndex, dataType, identifierDomain]);

    const storeNewTab = () => {
        let inputType = '';
        if (type === entryTypeOptions[0]) {
            inputType = 'number';
        } else if (type === entryTypeOptions[1]) {
            inputType = 'text';
        } else {
            inputType = 'multiple choice';
        }
    };

    const goBackward = () => {
        setColumnIndex((prevIndex) => {
            const newIndex = prevIndex - 1;
            return newIndex;
        });
    };

    const goForward = () => {
        if (validInputs()) {
            setColumnIndex((prevIndex) => {
                const newIndex = prevIndex + 1;
                return newIndex;
            });
        }
    };

    const validInputs = () => {
        if (!entryTypeOptions.includes(dataType[columnIndex])) {
            notify(Type.error, 'Must first select an entry type.');
            return false;
        } else {
            if (dataType[columnIndex] === entryTypeOptions[2]) {
                if (!entryOptions[columnIndex]) {
                    notify(Type.error, 'Must include entry options for multiple choice entry.');
                    return false;
                }
                if (entryOptions[columnIndex].length !== new Set(entryOptions[columnIndex]).size) {
                    notify(Type.error, 'Entry choices must not contain duplicates.');
                    return false;
                }
            }
        }
        return true;
    };

    const entryTypeOptions = ['Numerical Entry', 'Text Entry', 'Multiple Choice Entry'];

    const setDataTypeHelper = (type) => {
        setDataType((previousState) => {
            const updatedState = [...previousState];
            updatedState[columnIndex] = type;
            return updatedState;
        });
    };

    const setEntryOptionsHelper = (option) => {
        setEntryOptions((previousState) => {
            const updatedState = [...previousState];
            updatedState[columnIndex] = option;
            return updatedState;
        });
    };

    const setIdentifierDomainHelper = (selection) => {
        setIdentifierDomain((previousState) => {
            const updatedState = [...previousState];
            updatedState[columnIndex] = selection;
            return updatedState;
        });
    };

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
                    selectedOption={dataType[columnIndex]}
                    setSelectedOption={setDataTypeHelper}
                />
                {dataType === entryTypeOptions[2] && (
                    <DropdownFlex
                        options={entryOptions[columnIndex]}
                        setOptions={setEntryOptionsHelper}
                        label={'Entry Choices'}
                    />
                )}
                <YesNoSelector
                    label="Add Column to Identifier Domain"
                    layout="horizontal-start"
                    selection={identifierDomain[columnIndex]}
                    setSelection={setIdentifierDomainHelper}
                />
            </div>
        </WindowWrapper>
    );
}
