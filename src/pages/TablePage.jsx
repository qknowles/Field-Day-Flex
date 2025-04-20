import React, { useEffect, useState, useRef } from 'react';
import TabBar from '../components/TabBar';
import DataViewer from '../components/DataViewer';
import PageWrapper from '../wrappers/PageWrapper';
import { LizardIcon, ExportIcon, ImportIcon } from '../assets/icons';
import NewEntry from '../windows/NewEntry';
import ImportCSV from '../windows/ImportCSV';
import ColumnOptions from '../windows/ColumnOptions';
import Button from '../components/Button';
import ManageColumns from '../windows/MangeColumns';
import { useAtomValue, useAtom, useSetAtom } from 'jotai';
import { currentProjectName, currentTableName, currentUserEmail, allProjectNames, allTableNames, isAuthenticated } from '../utils/jotai.js';
import { generateCSVData } from '../components/ExportService.jsx';
import { CSVLink } from 'react-csv';
import { getProjectNames, getTabNames, getColumnsCollection } from '../utils/firestore.js';
import ColumnSelectorButton from '../components/ColumnSelectorButton';
import SearchBar from '../components/SearchBar'; // Import the SearchBar component
import { visibleColumnsAtom } from '../utils/jotai.js';
import { notify, Type } from '../components/Notifier';
import { db } from '../utils/firebase';
import { collection, addDoc } from 'firebase/firestore';

// variable to track if login was recorded across all renders, tablepage renders like 20 times :(
const hasRecordedLoginForSession = { value: false };

export default function TablePage() {
    const [selectedProject, setSelectedProject] = useAtom(currentProjectName);
    const [selectedTab, setSelectedTab] = useAtom(currentTableName);
    const setTabNames = useSetAtom(allTableNames);
    const setProjectNames = useSetAtom(allProjectNames);
    const email = useAtomValue(currentUserEmail);
    const authenticated = useAtomValue(isAuthenticated);
    const dataViewerRef = useRef(null);
    const autoLoginRecordedRef = useRef(false); // Add a ref to track if login was recorded

    const [showNewEntry, setShowNewEntry] = useState(false);
    const [showManageColumns, setShowManageColumns] = useState(false);
    const [showColumnOptions, setShowColumnOptions] = useState(false);
    const [newColumn, setNewColumn] = useState(['']);
    const [csvData, setCsvData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const csvDownloadRef = useRef(null);
    const [, setVisibleColumns] = useAtom(visibleColumnsAtom);
    const [columns, setColumns] = useState([]);
    const [ready, setReady] = useState(false);
    const [showImportWindow, setShowImportWindow] = useState(false);

    // Handle search functionality
    const handleSearch = (query) => {
    };

    // Reset column visibility
    const resetColumns = () => {
        if (columns.length > 0 && selectedTab) {
            const resetVisibility = {};
            columns.forEach(col => {
                resetVisibility[col.id] = true;
            });

            setVisibleColumns(prev => ({
                ...prev,
                [selectedTab]: resetVisibility
            }));

            notify(Type.success, "Column visibility reset");
        }
    };

    useEffect(() => {
        const fetchColumns = async () => {
            setColumns([]);
            if (selectedProject && selectedTab && email) {
                try {
                    const columnsData = await getColumnsCollection(selectedProject, selectedTab, email);
                    if (columnsData.length > 0) {
                        const sortedColumns = [...columnsData].sort(
                            (a, b) => a.order - b.order
                        );

                        setColumns(sortedColumns);
                    }
                } catch (error) {
                    console.error('Error fetching columns:', error);
                }
            }
        };

        fetchColumns();
    }, [selectedProject, selectedTab, email]);


    const toggleColumn = (columnId) => {
        setVisibleColumns(prev => {
            // Get the current visibility settings for the tab or initialize with empty object
            const currentTabSettings = prev[selectedTab] || {};

            // Create a new state object with the updated visibility
            const newState = {
                ...prev,
                [selectedTab]: {
                    ...currentTabSettings,
                    [columnId]: !currentTabSettings[columnId]
                }
            };
            return newState;
        });
    };

    const handleExport = async () => {
        if (!selectedProject || !selectedTab) {
            console.error("Project or Tab not selected");
            return;
        }

        const { headers, data } = await generateCSVData(selectedProject, selectedTab, email);
        if (data.length > 0) {
            setHeaders(headers);
            setCsvData(data);

            setTimeout(() => {
                if (csvDownloadRef.current) {
                    csvDownloadRef.current.link.click();
                }
            }, 500);
        }
    };

    const handleImport = async () => {
        if (!selectedProject || !selectedTab) {
            console.error("Project or Tab not selected");
            return;
        }
        setShowImportWindow(true);
    };

    useEffect(() => {
        const getFirstProject = async () => {
            try {
                const allProjectNames = await getProjectNames(email);
                setProjectNames(allProjectNames);

                const defaultProject = selectedProject || allProjectNames[0];
                if (!selectedProject && allProjectNames[0]) {
                    setSelectedProject(allProjectNames[0]);
                }

                const allTabNames = await getTabNames(email, defaultProject);
                setTabNames(allTabNames);

                if (!selectedTab && allTabNames[0]) {
                    setSelectedTab(allTabNames[0]);
                }
            } catch (error) {
                console.error("Error fetching project names or tabs in TablePage.");
            }
        };

        getFirstProject();
    }, [email]);


    useEffect(() => {
        const restoreLastSession = async () => {
            const savedProject = localStorage.getItem('selectedProject');
            const savedTab = localStorage.getItem('selectedTab');

            if (!email) return;

            try {
                const allProjectNames = await getProjectNames(email);
                setProjectNames(allProjectNames);

                const defaultProject = savedProject && allProjectNames.includes(savedProject)
                    ? savedProject
                    : allProjectNames[0];

                setSelectedProject(defaultProject);

                const tabs = await getTabNames(email, defaultProject);
                setTabNames(tabs);

                const defaultTab = savedTab && tabs.includes(savedTab)
                    ? savedTab
                    : tabs[0] || '';

                setSelectedTab(defaultTab);

                setReady(true);
            } catch (error) {
                console.error('Error restoring session:', error);
            }
        };

        if (email) restoreLastSession();
    }, [email]);


    useEffect(() => {
        if (!ready) return;
        if (dataViewerRef.current && dataViewerRef.current.fetchEntries) {
            dataViewerRef.current.fetchEntries();
        }
    }, [selectedProject, selectedTab, ready]);


    useEffect(() => {
        setNewColumn(['']);
    }, [showColumnOptions]);

    const recordAutoLogin = async () => {
        // Check both the module variable and the ref to be extra safe
        if (!email || hasRecordedLoginForSession.value || autoLoginRecordedRef.current) {
            return;
        }

        try {
            const loginHistoryRef = collection(db, 'loginHistory');
            const loginTime = new Date();

            await addDoc(loginHistoryRef, {
                email: email,
                loginDate: loginTime.toLocaleDateString(),
                loginTime: loginTime.toLocaleTimeString(),
                platform: 'desktop',
                type: 'auto_login'
            });

            // Mark as recorded in both places
            autoLoginRecordedRef.current = true;
            hasRecordedLoginForSession.value = true;

        } catch (error) {
            console.error('Error recording login history:', error);
        }
    };

    useEffect(() => {
        // Don't log every render
        if (email && authenticated && !hasRecordedLoginForSession.value) {

            // Queue the login recording with a slight delay to avoid race conditions
            const timer = setTimeout(() => {
                recordAutoLogin();
            }, 500);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [email, authenticated]);

    return (
        <PageWrapper>
            {/* Tab Navigation */}
            <TabBar />

            {/* Table Management Buttons */}
            {selectedTab && (
                <div className="flex items-center justify-between pt-3 px-5 pb-3 dark:bg-neutral-950 w-full">
                    <div className="flex items-center">
                        <p className="text-2xl mr-6">{selectedTab} - Entries</p>
                        <Button
                            text="New Entry"
                            onClick={() => setShowNewEntry(true)}
                            className="mr-6"
                            disabled={columns.length < 1}
                        />
                        <Button text="New Column" onClick={() => setShowColumnOptions(true)} className="mr-6" />
                        <Button text="Manage Columns" onClick={() => setShowManageColumns(true)} />
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Reset Columns Button */}
                        <Button
                            text="Reset Columns"
                            onClick={resetColumns}
                            className="text-sm"
                        />

                        {/* Search Bar Component - positioned between reset and column selector */}
                        <SearchBar onSearch={handleSearch} />


                        {/* Column Selector Button */}
                        {columns.length > 0 && (
                            <ColumnSelectorButton
                                columns={columns}
                                toggleColumn={toggleColumn}
                            />
                        )}

                        {/* Export Icon */}
                        <button
                            onClick={handleExport}
                            className="p-2 text-white hover:bg-neutral-700 rounded"
                            title="Export to CSV"
                        >
                            <ExportIcon className="h-6 w-6" />
                        </button>

                        {/* Import Icon */}
                        <button
                            onClick={handleImport}
                            className="p-2 text-white hover:bg-neutral-700 rounded"
                            title="Import CSV to this tab."
                        >
                            <ImportIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* CSV Link Download */}
                    {csvData.length > 0 && (
                        <CSVLink
                            data={csvData}
                            headers={headers}
                            filename={`${selectedProject ?? 'Project'}_${selectedTab ?? 'Table'}_${new Date().toISOString().split('T')[0]}.csv`}
                            className="hidden"
                            ref={csvDownloadRef}
                        />
                    )}
                </div>
            )}


            {/* Content Area */}
            <div className="flex-grow bg-white dark:bg-neutral-950">
                {!selectedProject ? (
                    <NoProjectDisplay />
                ) : !selectedTab ? (
                    <NoTabsDisplay />
                ) : !ready ? (
                    <div className="p-4 text-center text-neutral-400">Loading...</div>
                ) : (
                    <DataViewer ref={dataViewerRef} />
                )}
            </div>


            {/* Windows */}
            {showNewEntry && (
                <NewEntry
                    CloseNewEntry={() => setShowNewEntry(false)}
                    onEntryUpdated={() => {
                        // Refresh DataViewer after adding an entry
                        if (dataViewerRef.current && dataViewerRef.current.fetchEntries) {
                            dataViewerRef.current.fetchEntries();
                        }
                    }}
                />
            )}

            {showColumnOptions && (
                <ColumnOptions
                    ColumnNames={newColumn}
                    SetColumnNames={setNewColumn}
                    CancelColumnOptions={() => setShowColumnOptions(false)}
                    OpenNewTab={() => {
                        setShowColumnOptions(false);
                        // Refresh DataViewer after adding a column
                        if (dataViewerRef.current) {
                            if (dataViewerRef.current.fetchColumns) {
                                dataViewerRef.current.fetchColumns();
                            }
                            if (dataViewerRef.current.fetchEntries) {
                                dataViewerRef.current.fetchEntries();
                            }
                        }
                    }}
                    GenerateIdentifiers={null}
                    PossibleIdentifiers={null}
                    IdentifierDimension={null}
                    UnwantedCodes={null}
                    UtilizeUnwantedCodes={null}
                    header="Add Column"
                />
            )}

            {showManageColumns && (
                <ManageColumns
                    CloseManageColumns={() => setShowManageColumns(false)}
                />
            )}

            {showImportWindow && (
                <ImportCSV
                    CloseImportWindow={() => setShowImportWindow(false)}
                    onEntryUpdated={() => {
                        if (dataViewerRef.current && dataViewerRef.current.fetchEntries) {
                            dataViewerRef.current.fetchEntries();
                        }
                    }}
                />
            )}

        </PageWrapper>
    );
}

const NoProjectDisplay = () => (
    <div className="w-full text-center">
        <div className="pt-10">
            <h1 className="title">
                Field Day <br />
                <span
                    style={{
                        fontFamily: '"Lucida Handwriting", cursive',
                        fontSize: '0.7em',
                        position: 'relative',
                        top: '-0.3em',
                    }}
                >
                    Flex
                </span>
            </h1>
            <h2 className="subtitle">Data Management Tool</h2>
        </div>
        <div style={{ position: 'relative', top: '-5.0em' }}>
            <LizardIcon className="text-asu-maroon h-48 mx-auto rotate-45" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 text-center">
            Create a project or wait until you are added to one.
        </p>
    </div>
);

const NoTabsDisplay = () => (
    <div className="w-full text-center">
        <div className="pt-10">
            <h1 className="title">
                Field Day <br />
                <span
                    style={{
                        fontFamily: '"Lucida Handwriting", cursive',
                        fontSize: '0.7em',
                        position: 'relative',
                        top: '-0.3em',
                    }}
                >
                    Flex
                </span>
            </h1>
            <h2 className="subtitle">Data Management Tool</h2>
        </div>
        <div style={{ position: 'relative', top: '-5.0em' }}>
            <LizardIcon className="text-asu-maroon h-48 mx-auto rotate-45" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 text-center">
            No study subjects yet. Click the + tab to add your first study subject to this project.
        </p>
    </div>
);
