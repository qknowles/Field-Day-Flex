import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tableBody } from '../utils/variants';
//import { TableEntry } from './TableEntry';
import { getColumnsCollection } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';

const Table = ({ Email, SelectedProject, SelectedTab, OnNewEntry }) => {
    const [columns, setColumns] = useState([]);
    const [entries, setEntries] = useState([]);
    const [shownColumns, setShownColumns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!SelectedProject || !SelectedTab) return;
            try {
                setLoading(true);
                console.log('Loading data for:', SelectedTab);
                
                const columnsData = await getColumnsCollection(SelectedProject, SelectedTab, Email);
                if (columnsData) {
                    setColumns(columnsData);
                    setShownColumns(columnsData.map(col => col.name));
                }

            } catch (error) {
                console.error('Error loading table data:', error);
                notify(Type.error, 'Failed to load table data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [SelectedProject, SelectedTab, Email]);

    const removeEntry = (entryId) => {
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
    };

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    if (columns.length === 0) {
        return <div className="p-4 text-center">No columns defined for this table.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="p-2 text-left border-b font-semibold">Actions</th>
                        {columns.map(column => (
                            shownColumns.includes(column.name) && (
                                <th 
                                    key={column.id}
                                    className="p-2 text-left border-b font-semibold"
                                >
                                    {column.name}
                                </th>
                            )
                        ))}
                    </tr>
                </thead>
                <motion.tbody
                    variants={tableBody}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence>
                        {entries.map((entry, index) => (
                            <TableEntry
                                key={entry.id}
                                entrySnapshot={entry}
                                shownColumns={shownColumns}
                                removeEntry={removeEntry}
                                index={index}
                            />
                        ))}
                    </AnimatePresence>
                    {entries.length === 0 && (
                        <tr>
                            <td 
                                colSpan={shownColumns.length + 1}
                                className="p-4 text-center text-gray-500"
                            >
                                No entries found
                            </td>
                        </tr>
                    )}
                </motion.tbody>
            </table>
        </div>
    );
};

export default Table;