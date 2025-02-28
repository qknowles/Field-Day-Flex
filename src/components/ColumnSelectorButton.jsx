import React, { useState } from 'react';
import { ColumnToggleIcon } from '../assets/icons';
import ColumnSelector from './ColumnSelector';

const ColumnSelectorButton = ({ labels, columns, toggleColumn }) => {
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    return (
        <div className="relative">
            {/* Compact button that fits in small spaces */}
            <button
                onClick={() => setShowColumnSelector(prev => !prev)}
                className="p-2 text-white hover:bg-neutral-700 rounded"
                title="Toggle Columns"
            >
                <ColumnToggleIcon className="h-6 w-6" />
            </button>
            
            {showColumnSelector && (
                <ColumnSelector
                    show={showColumnSelector}
                    columns={columns}
                    setShow={setShowColumnSelector}
                    toggleColumn={toggleColumn}
                />
            )}
        </div>
    );
};

export default ColumnSelectorButton;
