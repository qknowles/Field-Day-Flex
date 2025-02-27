import { useEffect, useState } from 'react';
import classNames from 'classnames';
import InputLabel from './InputLabel';
import Button from './Button';
import React from 'react';
import { generateId } from '../utils/IdentificationGenerator'
import { getIdDimension } from '../utils/firestore';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';
import { useAtomValue } from 'jotai';
import { Type, notify } from '../components/Notifier';

export const DropdownFlex = ({ options, setOptions, label }) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingValue, setEditingValue] = useState('');

    useEffect(() => {
        setOptions((prevOptions) => {
            return ['Add Here', ...prevOptions.filter((opt) => opt !== 'Add Here')];
        });
    }, [setOptions]);

    const handleOptionChange = (index, newValue) => {
        setOptions((prevOptions) => {
            const updatedOptions = [...prevOptions];
            if (newValue.trim() === '') {
                updatedOptions.splice(index, 1);
            } else if (index === 0 && newValue !== 'Add Here') {
                updatedOptions.push(newValue);
            } else {
                updatedOptions[index] = newValue;
            }
            return ['Add Here', ...updatedOptions.filter((opt) => opt !== 'Add Here')];
        });
        setEditingIndex(null);
    };

    const handleInputBlur = () => {
        if (editingIndex !== null) {
            handleOptionChange(editingIndex, editingValue);
            setEditingIndex(null);
        }
    };

    const handleInputClick = (index, opt) => {
        setEditingIndex(index);
        if (opt === 'Add Here') {
            setEditingValue('');
        } else {
            setEditingValue(opt);
        }
    };

    return (
        <InputLabel
            label={label}
            layout="horizontal-multiple"
            input={
                <div className="space-y-2">
                    {options.map((opt, index) => (
                        <div key={index} className="flex items-center">
                            {editingIndex === index ? (
                                <input
                                    type="text"
                                    value={editingValue}
                                    autoFocus
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={handleInputBlur}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleOptionChange(index, editingValue);
                                        } else if (e.key === 'Escape') {
                                            setEditingIndex(null);
                                        }
                                    }}
                                    className="border border-gray-300 rounded"
                                />
                            ) : (
                                <span
                                    onClick={() => handleInputClick(index, opt)}
                                    className={classNames(
                                        'cursor-pointer px-2 pb-1 transition duration-150 rounded',
                                        opt === 'Add Here'
                                            ? 'border border-gray-300 hover:bg-gray-800'
                                            : 'px-4 pb-1 bg-asu-maroon text-white hover:bg-opacity-80',
                                    )}
                                >
                                    {opt}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            }
        />
    );
};

export const DropdownSelector = ({ label, options, selection, setSelection, layout }) => {
    return (
        <InputLabel
            label={label}
            layout={layout}
            input={
                <select value={selection} onChange={(e) => setSelection(e.target.value)}>
                    {options.map((optionName) => (
                        <option key={optionName} value={optionName}>
                            {optionName}
                        </option>
                    ))}
                </select>
            }
        />
    );
};

export const YesNoSelector = ({ label, selection, setSelection, layout }) => {
    const options = ['Yes', 'No'];
    return (
        <InputLabel
            label={label}
            layout={layout}
            input={
                <select
                    value={selection ? options[0] : options[1]}
                    onChange={(e) => {
                        if (e.target.value === options[0]) {
                            setSelection(true);
                        } else {
                            setSelection(false);
                        }
                    }}
                >
                    {options.map((optionName) => (
                        <option key={optionName} value={optionName}>
                            {optionName}
                        </option>
                    ))}
                </select>
            }
        />
    );
};

export const RadioButtons = ({ layout, label, options, selectedOption, setSelectedOption }) => {
    return (
        <InputLabel
            label={label}
            layout={layout}
            input={
                <div className="space-y-2">
                    {options.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id={option}
                                name={label}
                                value={option}
                                checked={selectedOption === option}
                                onChange={(e) => setSelectedOption(e.target.value)}
                                className="cursor-pointer"
                            />
                            <label htmlFor={option} className="cursor-pointer">
                                {option}
                            </label>
                        </div>
                    ))}
                </div>
            }
        />
    );
};

export const IdentificationGenerator_UI = ({ label, handleInputChange, userEntries }) => {
    const [id, setId] = useState('');
    const [idMaxLetter, setIdMaxLetter] = useState('');
    const [idMaxNumber, setIdMaxNumber] = useState('');
    const [letterArray, setLetterArray] = useState([]);
    const [numberArray, setNumberArray] = useState([]);
    const [buttonSwitch, setButtonSwitch] = useState(false);

    const email = useAtomValue(currentUserEmail);
    const project = useAtomValue(currentProjectName);
    const tab = useAtomValue(currentTableName);

    useEffect(() => {
        const fetchIdDimension = async () => {
            const idDimension = await getIdDimension(email, project, tab);
            if (idDimension && idDimension.length > 0) {
                setIdMaxLetter(idDimension[0]);
                setIdMaxNumber(idDimension[1]);
            }
        };

        fetchIdDimension();
    }, [email, project, tab]);

    useEffect(() => {
        if (idMaxLetter) {
            setLetterArray(() => {
                const temp = [];
                for (let i = 'A'.charCodeAt(0); i <= idMaxLetter.charCodeAt(0); i++) {
                    temp.push(String.fromCharCode(i));
                }
                return temp;
            });
        }

        if (idMaxNumber) {
            setNumberArray(() => {
                const temp = [];
                for (let i = 1; i <= idMaxNumber; i++) {
                    temp.push(i.toString());
                }
                return temp;
            });
        }
    }, [idMaxLetter, idMaxNumber]);

    useEffect(() => {
        if (!isNaN(id.charAt(id.length - 1))) {
            let tempCodeArray = id.split('-');
            tempCodeArray.sort();
            setId(tempCodeArray.join('-'));
            handleInputChange('Entry ID', tempCodeArray.join('-'));
        }
    }, [id])

    return (
        <div className="flex flex-col space-y-2 items-center justify-center">
            <div className="flex space-x-2 items-center justify-center">
                {letterArray.filter((letter) => !id.includes(letter)).length > 0 ? (
                    letterArray
                        .filter((letter) => !id.includes(letter))
                        .map((letter, index) => (
                            <Button
                                key={index}
                                flexible={false}
                                text={letter}
                                onClick={() => {
                                    if (id.length > 0) {
                                        setId(id + '-' + letter);
                                        setButtonSwitch(!buttonSwitch);
                                        handleInputChange('Entry ID', id + '-' + letter);
                                    } else {
                                        setId(id + letter);
                                        setButtonSwitch(!buttonSwitch);
                                        handleInputChange('Entry ID', id + letter);
                                    }
                                }}
                                disabled={buttonSwitch}
                            />
                        ))
                ) : (
                    <Button
                        key="placeholder"
                        flexible={false}
                        text="-"
                        disabled={true}
                    />
                )}
            </div>


            <div className="flex space-x-2 items-center justify-center">
                {numberArray.map((number, index) => (
                    <Button
                        key={index}
                        flexible={false}
                        text={number}
                        onClick={() => {
                            setId(id + number.toString());
                            setButtonSwitch(!buttonSwitch);
                            handleInputChange('Entry ID', id + number.toString());
                        }}
                        disabled={!buttonSwitch}
                    />
                ))}
            </div>

            <InputLabel
                label={'Entry ID'}
                layout={'horizontal-single'}
                input={
                    <input
                        type="text"
                        value={id}
                        onChange={(e) => {
                            let value = e.target.value;

                            if (value === '' || value.length - id.length < -1) {
                                setId('');
                                setButtonSwitch(false);
                                handleInputChange('Entry ID', '');
                                return;
                            }

                            if (value.length - id.length === 1) {
                                if (!buttonSwitch) {
                                    value = value.toUpperCase();
                                    if (letterArray.includes(value.charAt(value.length - 1))) {
                                        if (!value.slice(0, value.length - 1).includes(value.charAt(value.length - 1))) {
                                            if (id.length > 0) {
                                                setId(value.slice(0, value.length - 1) + '-' + value.charAt(value.length - 1));
                                                setButtonSwitch(!buttonSwitch);
                                                handleInputChange(value.slice(0, value.length - 1) + '-' + value.charAt(value.length - 1));
                                            } else {
                                                setId(value);
                                                setButtonSwitch(!buttonSwitch);
                                                handleInputChange('Entry ID', value);
                                            }
                                        }
                                    }
                                } else {
                                    if (value.charAt(value.length - 1) === '-' || numberArray.includes(value.charAt(value.length - 1))) {
                                        setId(value);
                                        if (value.charAt(value.length - 1) !== '-') {
                                            setButtonSwitch(!buttonSwitch);
                                        }
                                        handleInputChange('Entry ID', value);
                                    }
                                }
                            } else if (value.length - id.length === -1) {
                                if (value.charAt(value.length - 1) !== id.charAt(id.length - 1)) {
                                    if (value.charAt(value.length - 1) === '-') {
                                        setId(value.slice(0, value.length - 1));
                                        setButtonSwitch(!buttonSwitch);
                                        handleInputChange('Entry ID', value.slice(0, value.length - 1));
                                    } else {
                                        setId(value);
                                        setButtonSwitch(!buttonSwitch);
                                        handleInputChange('Entry ID', value);
                                    }
                                }
                            }
                        }}
                    />
                }
            />

            <Button
                flexible={false}
                text="Generate id"
                onClick={async () => {
                    const temp = await generateId(email, project, tab, id, userEntries);
                    if (temp) {
                        notify(Type.success, 'Id is available.');
                        setId(temp);
                        await handleInputChange('Entry ID', temp);
                    } else {
                        notify(Type.error, 'No codes available.');
                        setId('');
                        await handleInputChange('Entry ID', '');
                    }
                }}
            />
        </div>
    );
};
