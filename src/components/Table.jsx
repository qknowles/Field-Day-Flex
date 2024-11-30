import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function Table({ Email, SelectedProject, SelectedTab }) {
    const [columns, setColumns] = useState([]);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load columns and entries when project/tab changes
    useEffect(() => {
        const loadData = async () => {
            if (!SelectedProject || !SelectedTab) return;
            try {
                setLoading(true);
                console.log('Loading data for:', SelectedProject, SelectedTab);
                
                // First get columns to know structure
                const columnsRef = collection(db, `Projects/${SelectedProject}/Tabs/${SelectedTab}/Columns`);
                const columnsSnapshot = await getDocs(columnsRef);
                console.log('Columns data:', columnsSnapshot.docs.map(d => d.data()));
                
                const columnsData = columnsSnapshot.docs
                    .map(doc => ({...doc.data(), id: doc.id}))
                    .sort((a, b) => a.order - b.order);
                setColumns(columnsData);
    
                // Then get entries
                const entriesRef = collection(db, `Projects/${SelectedProject}/Tabs/${SelectedTab}/Entries`);
                const entriesSnapshot = await getDocs(entriesRef);
                console.log('Entries data:', entriesSnapshot.docs.map(d => d.data()));
                
                const entriesData = entriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEntries(entriesData);
            } catch (error) {
                console.error('Error loading table data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [SelectedProject, SelectedTab]);
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        {columns.map(column => (
                            <th 
                                key={column.id}
                                className="p-2 text-left border-b font-semibold"
                            >
                                {column.column_name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {entries.map(entry => (
                        <tr key={entry.id}>
                            {columns.map(column => (
                                <td 
                                    key={`${entry.id}-${column.id}`}
                                    className="p-2 border-b"
                                >
                                    {entry.entry_data[column.column_name] || 'N/A'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}