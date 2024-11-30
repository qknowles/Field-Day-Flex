import React, { useState, useEffect } from 'react';
import { getEntriesForTab, getColumnsCollection } from '../utils/firestore';
import Table from './Table';

const DataViewer = ({ Email, SelectedProject, SelectedTab }) => {
    const [entries, setEntries] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch columns using the existing function
            const columnsData = await getColumnsCollection(SelectedProject, SelectedTab, Email);
            if (columnsData) {
                setColumns(columnsData);
            } else {
                setColumns([]);
            }

            // Fetch entries for the tab
            const entriesData = await getEntriesForTab(SelectedProject, SelectedTab, Email);
            if (entriesData) {
                setEntries(entriesData);
            } else {
                setEntries([]);
            }
        } catch (error) {
            console.error('Error fetching data for DataViewer:', error);
        } finally {
            setLoading(false);
        }
    };

    // Trigger data fetching when the project or tab changes
    useEffect(() => {
        if (SelectedProject && SelectedTab) {
            fetchData();
        }
    }, [SelectedProject, SelectedTab]);

    if (loading) {
        return <div className="p-4 text-center">Loading data...</div>;
    }

    if (!entries.length) {
        return <div className="p-4 text-center">No entries found for this tab.</div>;
    }

    return (
        <Table
            Email={Email}
            SelectedProject={SelectedProject}
            SelectedTab={SelectedTab}
            entries={entries}
            columns={columns}
        />
    );
};

export default DataViewer;
