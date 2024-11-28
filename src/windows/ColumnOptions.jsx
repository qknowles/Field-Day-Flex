import React, { useEffect, useState } from 'react';
import { DropdownFlex, RadioButtons, YesNoSelector } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';
import { tabExists, createTab } from '../utils/firestore';

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

        setEntryOptionsHelper(tempEntryOptions);
    }, [columnIndex, dataType, tempEntryOptions, entryOptions, identifierDomain, requiredField]);

    const storeNewTab = async () => {
        if (validInputs()) {
            let finalEntryOptions = Array.from({ length: ColumnNames.length }, () => []);
            for (let i = 0; i < ColumnNames.length; i++) {
            finalEntryOptions[i] = entryOptions[i].filter((name) => name !== 'Add Here');
            }

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
                    OpenNewTab(TabName);
                    return;
                } else {
                    notify(Type.error, 'Error creating subject.');
                    return;
                }
            }
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
            setTempEntryOptions([]);
        }
    };

    const validInputs = () => {
        if (!entryTypeOptions.includes(dataType[columnIndex])) {
            notify(Type.error, 'Must first select an entry type.');
            return false;
        } else {
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
        }
        return true;
    };

    const entryTypeOptions = [
        'number',
        'text',
        'date',
        'multiple choice',
    ];

    const setDataTypeHelper = (type) => {
        setDataType((previousState) => {
            const updatedState = [...previousState];
            updatedState[columnIndex] = type;
            return updatedState;
        });
    };

    const setEntryOptionsHelper = (options) => {
        setEntryOptions((previousState) => {
            const updatedState = [...previousState];
            updatedState[columnIndex] = options;
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

    const setRequiredFieldHelper = (selection) => {
        setRequiredField((previousState) => {
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
                <span className='text-sm'>Data Entry Type:</span>
                <RadioButtons
                    layout="horizontal"
                    options={entryTypeOptions}
                    selectedOption={dataType[columnIndex]}
                    setSelectedOption={setDataTypeHelper}
                />
                {dataType[columnIndex] === entryTypeOptions[3] && (
                    <DropdownFlex
                        options={entryOptions[columnIndex]}
                        setOptions={setTempEntryOptions}
                        label={'Entry Choices'}
                    />
                )}
                <YesNoSelector
                    label="Make column a required field"
                    layout="horizontal-start"
                    selection={requiredField[columnIndex]}
                    setSelection={setRequiredFieldHelper}
                />
                <YesNoSelector
                    label="Include column in entry ID domain"
                    layout="horizontal-start"
                    selection={identifierDomain[columnIndex]}
                    setSelection={setIdentifierDomainHelper}
                />
            </div>
        </WindowWrapper>
    );
}
