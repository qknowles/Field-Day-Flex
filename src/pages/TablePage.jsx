import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import TabBar from '../components/TabBar';
import PageWrapper from '../wrappers/PageWrapper';
import { fetchTabData, saveTabData } from '../api'; // Replace with real API calls

export default function TablePage({ email }) {
    const [selectedProject, setSelectedProject] = useState(''); // Add project state
    const [selectedTab, setSelectedTab] = useState('');
    const [columns, setColumns] = useState({});
    const [entries, setEntries] = useState([]);
    const [labels, setLabels] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);

    // Fetch data when a tab is selected
    useEffect(() => {
        if (selectedTab) {
            const loadTabData = async () => {
                const data = await fetchTabData(selectedTab); // API call to fetch tab data
                setColumns(data.columns);
                setEntries(data.entries);
                setLabels(Object.keys(data.columns));
                setIsAdmin(data.isAdmin);
            };
            loadTabData();
        }
    }, [selectedTab]);

    // Add a new row
    const handleAddRow = () => {
        const newRow = labels.reduce((acc, label) => {
            acc[label] = columns[label]?.type === 'dropdown' ? columns[label].choices[0] : '';
            return acc;
        }, {});
        setEntries([...entries, newRow]);
    };

    // Add a new column
    const handleAddColumn = () => {
        const newColumnName = prompt('Enter column name:');
        if (!newColumnName) return;
        setColumns({ ...columns, [newColumnName]: { show: true, type: 'text' } });
        setLabels([...labels, newColumnName]);
    };

    // Save changes to backend
    const handleSaveChanges = async () => {
        await saveTabData(selectedTab, { columns, entries });
        alert('Changes saved!');
    };

    return (
        <PageWrapper>
            <TabBar
                email={email}
                selectedProject={selectedProject} // Pass selectedProject
                setSelectedProject={setSelectedProject} // Pass setSelectedProject
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
            />
            <div className="flex-grow bg-white dark:bg-neutral-950 p-4">
                {selectedTab ? (
                    <>
                        <Table
                            name={selectedTab}
                            labels={labels}
                            columns={columns}
                            entries={entries}
                            setEntries={setEntries}
                        />
                        <div className="flex justify-end mt-4 space-x-2">
                            {isAdmin && (
                                <>
                                    <button
                                        className="px-4 py-2 bg-blue-500 text-white rounded"
                                        onClick={handleAddColumn}
                                    >
                                        Add Column
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-green-500 text-white rounded"
                                        onClick={handleAddRow}
                                    >
                                        Add Row
                                    </button>
                                </>
                            )}
                            <button
                                className="px-4 py-2 bg-gray-500 text-white rounded"
                                onClick={handleSaveChanges}
                            >
                                Save Changes
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-500">
                        Select a tab to display the table.
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
