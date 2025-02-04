import React, { useState, forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { tableRows } from '../utils/variants';
import { CheckIcon, CloseIcon, DeleteIcon, EditIcon } from '../assets/icons';
import { Type, notify } from './Notifier';

export const TableEntry = forwardRef((props, ref) => {
    const { entrySnapshot, shownColumns, index } = props;

    const [entryUIState, setEntryUIState] = useState('viewing');
    const [entryData, setEntryData] = useState(entrySnapshot.entry_data || {});
    const [deleteMessage] = useState('Are you sure you want to delete this row?');

    const handleEditClick = () => setEntryUIState('editing');
    const handleDeleteClick = () => setEntryUIState('deleting');

    const handleSaveClick = () => {
        notify(Type.info, 'Save functionality coming soon');
        setEntryUIState('viewing');
    };

    const handleCancelClick = () => {
        setEntryData(entrySnapshot.entry_data || {});
        setEntryUIState('viewing');
    };

    return (
        <motion.tr
            className="relative hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 ease-in-out"
            variants={tableRows}
            initial="initial"
            animate="visible"
            custom={index}
            exit="exit"
            ref={ref}
        >
            <Actions
                onEditClick={handleEditClick}
                onCancelClick={handleCancelClick}
                onDeleteClick={handleDeleteClick}
                onSaveClick={handleSaveClick}
                entryUIState={entryUIState}
                deleteMessage={deleteMessage}
            />

            {shownColumns.map((columnName) => (
                <EntryItem
                    key={columnName}
                    columnName={columnName}
                    entryUIState={entryUIState}
                    entryData={entryData}
                    setEntryData={setEntryData}
                    className={getColumnClassName(columnName)}
                />
            ))}
        </motion.tr>
    );
});

const getColumnClassName = (columnName) => {
    const classMap = {
        'Date & Time': 'dateTimeColumn',
        'Site': 'siteColumn',
        'Year': 'yearColumn',
        'Taxa': 'taxaColumn',
        'Genus': 'genusColumn',
        'Species': 'speciesColumn'
    };
    return classMap[columnName] || '';
};

const EntryItem = ({ columnName, entryUIState, setEntryData, entryData, className }) => {
    const [editable] = useState(true);

    const onChangeHandler = (e) => {
        setEntryData(prev => ({
            ...prev,
            [columnName]: e.target.value
        }));
    };

    const disabled =
        columnName === 'Year' ||
        entryUIState === 'viewing' ||
        (entryUIState === 'editing' && !editable) ||
        entryUIState === 'deleting';

    const value = entryData[columnName] || '';
    const size = value ? String(value).length : 1;

    return (
        <td className={`text-left border-b border-neutral-400 dark:border-neutral-600 p-1 ${className || ''}`}>
            <input
                readOnly={disabled}
                className="pl-2 w-full read-only:bg-transparent read-only:border-transparent read-only:focus:outline-none"
                value={value || 'N/A'}
                onChange={onChangeHandler}
                onClick={() => {
                    if (columnName === 'Year' && entryUIState === 'editing') {
                        notify(Type.error, 'Year cannot be edited directly');
                    }
                }}
                size={size}
            />
        </td>
    );
};

const Actions = ({
    onEditClick,
    onDeleteClick,
    onSaveClick,
    onCancelClick,
    entryUIState,
    deleteMessage,
}) => {
    return (
        <td className="border-b border-neutral-400 dark:border-neutral-600 p-2">
            <div className="flex flex-row w-full justify-around">
                <AnimatePresence>
                    {entryUIState === 'deleting' && (
                        <motion.div
                            key="deleteMsg"
                            className="absolute text-lg left-8 -top-3 z-10 px-2 rounded-md drop-shadow-xl border-[1px] bg-red-800/10 backdrop-blur border-red-800 shadow-lg shadow-red-800/25 leading-tight"
                            initial={{ left: '-2rem', opacity: 0 }}
                            animate={{ left: '2rem', opacity: 1 }}
                            exit={{
                                left: '-20rem',
                                opacity: 0,
                                transition: { opacity: { duration: 0.25 } },
                            }}
                        >
                            {deleteMessage}
                        </motion.div>
                    )}
                    {entryUIState === 'viewing' && (
                        <>
                            <div
                                className="w-5 h-5 hover:scale-125 transition hover:cursor-pointer"
                                onClick={onEditClick}
                            >
                                <EditIcon />
                            </div>
                            <div
                                className="w-5 h-5 hover:scale-125 transition hover:cursor-pointer"
                                onClick={onDeleteClick}
                            >
                                <DeleteIcon />
                            </div>
                        </>
                    )}
                    {(entryUIState === 'editing' || entryUIState === 'deleting') && (
                        <>
                            <div
                                className="w-5 h-5 hover:scale-125 transition hover:cursor-pointer"
                                onClick={onSaveClick}
                            >
                                <CheckIcon />
                            </div>
                            <div
                                className="w-5 h-5 hover:scale-125 transition hover:cursor-pointer"
                                onClick={onCancelClick}
                            >
                                <CloseIcon />
                            </div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </td>
    );
};

export default TableEntry;