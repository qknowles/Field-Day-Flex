import React, { useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import { Type, notify } from '../components/Notifier.jsx';
import InputLabel from '../components/InputLabel.jsx';
import Button from '../components/Button';

export default function SelectImportColumn({ CloseColumnSelector, Columns, SetSelectedColumns }) {
    // Initialize state based directly on the passed in Columns array of strings
    const [selectedState, setSelectedState] = useState(() => {
        const initial = {};
        (Columns || []).forEach(col => {
            // Skip "actions"
            if (col && !['actions'].includes(col)) {
                initial[col] = true;
            }
        });
        return initial;
    });

    const handleToggleColumn = columnId => {
        setSelectedState(prev => ({
            ...prev,
            [columnId]: !prev[columnId],
        }));
    };

    const saveColumns = () => {
        // Filter out columns that are not selected or should be skipped (e.g. "actions" and "datetime")
        const finalSelected = (Columns || []).filter(col => 
            selectedState[col] && !['actions'].includes(col)
        );
        SetSelectedColumns(finalSelected);
        CloseColumnSelector();
    };

    return (
        <WindowWrapper
            header="Import CSV to tab"
            onLeftButton={CloseColumnSelector}
            onRightButton={saveColumns}
            leftButtonText="Back"
            rightButtonText="Confirm Columns"
        >
            <div className="p-4">
                <h3 className="font-semibold mb-3">Toggle Columns</h3>
                <div className="max-h-72 overflow-y-auto">
                    {(Columns || [])
                        .filter(col => !['actions'].includes(col))
                        .map(col => (
                            <div key={col} className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id={`column-${col}`}
                                    checked={selectedState[col] ?? false}
                                    onChange={() => handleToggleColumn(col)}
                                    className="mr-2"
                                />
                                <label htmlFor={`column-${col}`} className="cursor-pointer">
                                    {col}
                                </label>
                            </div>
                        ))}
                </div>
            </div>
        </WindowWrapper>
    );
}
