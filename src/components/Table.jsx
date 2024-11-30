import React, { useState } from 'react';

const Table = ({ Email, SelectedProject, SelectedTab, entries, columns, onEdit, onDelete }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); 

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Sort entries based on the current sorting configuration
    const sortedEntries = [...entries].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (sortConfig.direction === 'asc') {
            return aValue.localeCompare(bValue);
        }
        return bValue.localeCompare(aValue);
    });

    // Sort columns by the `order` field
    const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

    if (!entries.length) {
        return <div className="p-4 text-center">No entries found for this tab.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 text-left border-b font-semibold">Actions</th>
                        {sortedColumns.map((column) => (
                            <th
                                key={column.id}
                                className="p-2 text-left border-b font-semibold cursor-pointer"
                                onClick={() => handleSort(column.name)}
                            >
                                {column.name} {sortConfig.key === column.name ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedEntries.map((entry) => (
                        <tr key={entry.id}>
                            <td className="p-2">
                                <button className="btn btn-edit" onClick={() => onEdit?.(entry)}>
                                    Edit
                                </button>
                                <button className="btn btn-delete ml-2" onClick={() => onDelete?.(entry.id)}>
                                    Delete
                                </button>
                            </td>
                            {sortedColumns.map((column) => (
                                <td key={column.id} className="p-2 text-left">
                                    {entry[column.name] !== undefined ? entry[column.name] : 'N/A'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;