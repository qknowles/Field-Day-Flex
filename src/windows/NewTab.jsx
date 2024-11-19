import React, { useEffect, useState } from 'react';
import { DropdownFlex, DropdownSelector, YesNoSelector } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { Type, notify } from '../components/Notifier';

export default function NewTab({ CancelTab, OpenNewProject, Email }) {
    const [tabName, setTabName] = useState('');
    
    const [generateIdentifiers, setGenerateIdentifiers] = useState(false);
    const [firstIdentifierDimension, setFirstIdentifierDimension] = useState('');
    const [secondIdentifierDimension, setSecondIdentifierDimension] = useState('');
    const dimensionsChar = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const dimensionsNum = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const [unwantedCodes, setUnwantedCodes] = useState([]);
    const [utilizeUnwantedCodes, setUtilizeUnwantedCodes] = useState(false);

    const [rightButtonText, setRightButtonText] = useState('Create');
    const [columnNames, setColumnNames] = useState([]);
    
    useEffect(() => {
        if (columnNames.length > 0) {
            setRightButtonText('Next Step');
        } else {
            setRightButtonText('Create');
        }
    }, [columnNames]);

    const continueTab = async () => {};

    return (
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
    );
}
