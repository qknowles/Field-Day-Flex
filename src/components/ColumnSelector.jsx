import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import { useAtom } from 'jotai';
import { visibleColumnsAtom, currentTableName } from '../utils/jotai';

export default function ColumnSelector({ show, columns, setShow, toggleColumn }) {
  const [visibleColumns, setVisibleColumns] = useAtom(visibleColumnsAtom);
  const [currentTab] = useAtom(currentTableName);
  
  // Modified useEffect to ensure column visibility is initialized correctly
  useEffect(() => {
    if (columns && columns.length > 0 && currentTab) {
      // Check if we need to initialize the visibility state for this tab
      if (!visibleColumns[currentTab]) {
        console.log('Initializing visibility for tab:', currentTab);
        const initialState = {};
        columns.forEach(column => {
          initialState[column.id] = true;
        });
        
        setVisibleColumns(prev => ({
          ...prev,
          [currentTab]: initialState
        }));
      }
    }
  }, [columns, currentTab, setVisibleColumns]);

  // Don't render if show is false or if required data is missing
  if (!show || !columns || columns.length === 0 || !currentTab) {
    return null;
  }

  // Use the toggleColumn from props if provided, otherwise use local implementation
  const handleToggleColumn = (columnId) => {
    console.log('Toggling column:', columnId, 'for tab:', currentTab);
    
    if (toggleColumn) {
      toggleColumn(columnId);
    } else {
      // Ensure the tab exists in the state before trying to update it
      const currentTabSettings = visibleColumns[currentTab] || {};
      setVisibleColumns(prev => ({
        ...prev,
        [currentTab]: {
          ...currentTabSettings,
          [columnId]: !currentTabSettings[columnId]
        }
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute right-0 top-10 z-50 bg-white dark:bg-neutral-800 shadow-lg rounded-md p-4 w-64"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Toggle Columns</h3>
        <button 
          onClick={() => setShow(false)}
          className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          ✕
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {columns
          .filter(column => !['actions', 'datetime'].includes(column.id))
          .map(column => {
            // Add debug logging to help troubleshoot the checked state
            const isVisible = visibleColumns[currentTab]?.[column.id] !== false;
            console.log(`Column ${column.name} (${column.id}) visibility:`, isVisible);
            
            return (
              <div key={column.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`column-${column.id}`}
                  checked={isVisible}
                  onChange={() => handleToggleColumn(column.id)}
                  className="mr-2"
                />
                <label htmlFor={`column-${column.id}`} className="cursor-pointer">
                  {column.name}
                </label>
              </div>
            );
          })}
      </div>
      <div className="mt-3 flex justify-end">
        <Button 
          text="Apply" 
          onClick={() => setShow(false)}
          className="text-sm"
        />
      </div>
    </motion.div>
  );
}
