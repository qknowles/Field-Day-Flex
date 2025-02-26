import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import { useAtom } from 'jotai';
import { visibleColumnsAtom, currentTableName } from '../utils/jotai';

export default function ColumnSelector({ columns, onClose }) {
  const [visibleColumns, setVisibleColumns] = useAtom(visibleColumnsAtom);
  const [currentTab] = useAtom(currentTableName);
  
  // Initialize visibility state when columns change or tab changes
  useEffect(() => {
    if (columns.length > 0) {
      if (!visibleColumns[currentTab]) {
        // Initialize all columns as visible for this tab
        const initialState = {};
        columns.forEach(column => {
          initialState[column.id] = true;
        });
        
        setVisibleColumns(prev => ({
          ...prev,
          [currentTab]: initialState
        }));
      } else if (visibleColumns[currentTab]) {
        // Check if we need to add any new columns that didn't exist before
        const updatedState = { ...visibleColumns[currentTab] };
        let needsUpdate = false;
        
        columns.forEach(column => {
          if (updatedState[column.id] === undefined) {
            updatedState[column.id] = true;
            needsUpdate = true;
          }
        });
        
        if (needsUpdate) {
          setVisibleColumns(prev => ({
            ...prev,
            [currentTab]: updatedState
          }));
        }
      }
    }
  }, [columns, currentTab]);

  const toggleColumn = (columnId) => {
    setVisibleColumns(prev => ({
      ...prev,
      [currentTab]: {
        ...prev[currentTab],
        [columnId]: !prev[currentTab][columnId]
      }
    }));
  };

  if (!visibleColumns[currentTab]) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute right-24 top-16 z-50 bg-white dark:bg-neutral-800 shadow-lg rounded-md p-4 w-64"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Toggle Columns</h3>
        <button 
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          ✕
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {columns.map(column => (
          <div key={column.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`column-${column.id}`}
              checked={visibleColumns[currentTab][column.id] || false}
              onChange={() => toggleColumn(column.id)}
              className="mr-2"
            />
            <label htmlFor={`column-${column.id}`} className="cursor-pointer">
              {column.name}
            </label>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Button 
          text="Apply" 
          onClick={onClose}
          className="text-sm"
        />
      </div>
    </motion.div>
  );
}

