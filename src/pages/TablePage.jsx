import React, { useState, useEffect } from 'react';
//import Table from '../components/Table';
import TabBar from '../components/TabBar';
import PageWrapper from '../wrappers/PageWrapper';
import { LizardIcon } from '../assets/icons';
import TableTools from '../wrappers/TableTools';
import ColumnSelectorButton from '../components/ColumnSelectorButton';
import { getDocsFromCollection, getCollectionName } from '../utils/firestore';

export default function TablePage({ email }) {
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedTab, setSelectedTab] = useState('');
    const [columns, setColumns] = useState({});
    const [entries, setEntries] = useState([]);
    const [labels, setLabels] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);

    // Fetch data when a tab is selected
    useEffect(() => {
        if (selectedTab && selectedProject) {
            const loadTabData = async () => {
                try {
                    const collectionName = getCollectionName('live', selectedProject, selectedTab);
                    const snapshot = await getDocsFromCollection(collectionName);
                    if (snapshot) {
                        setEntries(snapshot.docs);
                        // TODO: Load column configuration
                        setIsAdmin(true); // Temporary for testing
                    }
                } catch (error) {
                    console.error('Error loading data:', error);
                }
            };
            loadTabData();
        }
    }, [selectedTab, selectedProject]);

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
        try {
            const collectionName = getCollectionName('live', selectedProject, selectedTab);
            // TODO: Implement save functionality
            console.log('Saving to collection:', collectionName);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const toggleColumn = (label) => {
        setColumns(prev => ({
            ...prev,
            [label]: {
                ...prev[label],
                show: !prev[label]?.show
            }
        }));
    };

    const renderContent = () => {
        // No project selected
        if (!selectedProject) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <LizardIcon className="w-32 h-32 text-asu-maroon mb-6" />
                    <h2 className="text-2xl font-semibold mb-4">Select a Project</h2>
                    <p className="text-gray-500 text-center">
                        Choose a project from the dropdown menu above to get started.
                    </p>
                </div>
            );
        }

        // Project selected but no tab
        if (!selectedTab) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <LizardIcon className="w-32 h-32 text-asu-maroon mb-6" />
                    <h2 className="text-2xl font-semibold mb-4">Select a Tab</h2>
                    <p className="text-gray-500 text-center">
                        Select a tab to display the table.
                    </p>
                </div>
            );
        }

        // Project and tab selected
        return (
            <>
                <TableTools>
                    <ColumnSelectorButton
                        labels={labels}
                        columns={columns}
                        toggleColumn={toggleColumn}
                    />
                    {isAdmin && (
                        <>
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                onClick={handleAddColumn}
                            >
                                Add Column
                            </button>
                            <button
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                onClick={handleAddRow}
                            >
                                Add Row
                            </button>
                        </>
                    )}
                    <button
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        onClick={handleSaveChanges}
                    >
                        Save Changes
                    </button>
                </TableTools>

                {/* Table will go here
                <Table
                    name={selectedTab}
                    labels={labels}
                    columns={columns}
                    entries={entries}
                    setEntries={setEntries}
                />
                */}

                {/* Show empty state when no entries */}
                {entries.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                        <LizardIcon className="w-32 h-32 text-asu-maroon mb-6" />
                        <h2 className="text-2xl font-semibold mb-4">No Data Yet</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                            Start adding data to your study subject using the controls above.
                        </p>
                    </div>
                )}
            </>
        );
    };

    return (
        <PageWrapper>
            <TabBar
                email={email}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
            />
            <div className="flex-grow bg-white dark:bg-neutral-950 p-4">
                {renderContent()}
            </div>
        </PageWrapper>
    );
}
