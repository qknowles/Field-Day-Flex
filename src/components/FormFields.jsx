import { useEffect, useState, useCallback } from 'react';
import classNames from 'classnames';
import InputLabel from './InputLabel';
import Button from './Button';
import React from 'react';
import IdentificationGenerator from '../utils/IdentificationGenerator'

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

export const IdentificationGenerator_UI = ({ label, handleInputChange }) => {
    const [id, setId] = useState('');

    const generateId = useCallback((value) => IdentificationGenerator(value), []);

    return (
        <div className="flex flex-col space-y-2">
            <InputLabel
                label={label}
                layout={'horizontal-single'}
                input={
                    <input
                        type="text"
                        value={id}
                        onChange={(e) => {
                            const value = e.target.value;
                            setId(value);
                            handleInputChange('Entry ID', value);
                        }}
                    />
                }
            />
            <Button
                className="items-center justify-center"
                flexible={false}
                text="Generate Id"
                onClick={() => {
                    const GenId = generateId(id);
                    setId(GenId);
                    handleInputChange('Entry ID', GenId);
                }}
            />
        </div>
    );
};


