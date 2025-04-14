import React, { useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import { Type, notify } from '../components/Notifier.jsx';
import InputLabel from '../components/InputLabel.jsx';
import Button from '../components/Button';

export default function SelectImportColumn({
    CloseColumnSelector,
    Columns,
    SelectedColumns,
    SetSelectedColumns
}) {
    const [selected, setSelected] = useState(SelectedColumns);

    const handleToggleColumn = columnId => {
        setSelected(prev =>
            prev.includes(columnId)
                ? prev.filter(col => col !== columnId)
                : [...prev, columnId]
        );
    };

    const saveColumns = () => {
        SetSelectedColumns(selected);
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
                        .map(col => (
                            <div key={col} className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id={`column-${col}`}
                                    checked={selected.includes(col)}
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
