import React, { useEffect, useState, useRef} from 'react';
import TabBar from '../components/TabBar';
import DataViewer from '../components/DataViewer';
import PageWrapper from '../wrappers/PageWrapper';
import { LizardIcon } from '../assets/icons';
import NewEntry from '../windows/NewEntry';
import ColumnOptions from '../windows/ColumnOptions';
import Button from '../components/Button';
import ManageColumns from '../windows/MangeColumns';
import { useAtomValue, useAtom } from 'jotai';
import { currentProjectName, currentTableName, currentUserEmail, allProjectNames, allTableNames } from '../utils/jotai.js';
import { ExportIcon } from '../assets/icons';
import { generateCSVData } from '../components/ExportService.jsx';
import { CSVLink } from 'react-csv';
import { getProjectNames, getTabNames, getColumnsCollection } from '../utils/firestore.js';
import ColumnSelectorButton from '../components/ColumnSelectorButton';
import SearchBar from '../components/SearchBar'; // Import the SearchBar component
import { filteredEntriesAtom } from '../components/SearchBar'; // Import the filteredEntriesAtom
import { visibleColumnsAtom } from '../utils/jotai.js';

export default function TablePage() {
    const [selectedProject, setSelectedProject] = useAtom(currentProjectName);
    const [selectedTab, setSelectedTab] = useAtom(currentTableName);
    const [tabNames, setTabNames] = useAtom(allTableNames);
    const [projectNames, setProjectNames] = useAtom(allProjectNames);
    const email = useAtomValue(currentUserEmail);
    const dataViewerRef = useRef(null);

    const [showNewEntry, setShowNewEntry] = useState(false);
    const [showManageColumns, setShowManageColumns] = useState(false);
    const [showColumnOptions, setShowColumnOptions] = useState(false);
    const [newColumn, setNewColumn] = useState(['']);
    const [showExportModal, setShowExportModal] = useState(false);
    const [triggerExport, setTriggerExport] = useState(false);
    const [csvData, setCsvData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const csvDownloadRef = useRef(null);
    const [columnOrder, setColumnOrder] = useState([]);
    const [visibleColumns, setVisibleColumns] = useAtom(visibleColumnsAtom);
    const [columns, setColumns] = useState([]);
    const [filteredEntries] = useAtom(filteredEntriesAtom); // Get filtered entries

    // Handle search functionality
    const handleSearch = (query) => {
        console.log("Searching for:", query);
        // The actual filtering is handled in the DataViewer component
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
            if (selectedProject && selectedTab && email) {
                try {
                    const columnsData = await getColumnsCollection(selectedProject, selectedTab, email);
                    const defaultColumns = [
                        { id: 'actions', name: 'Actions', type: 'actions', order: -3 },
                        { id: 'datetime', name: 'Date & Time', type: 'datetime', order: -2 },
                    ];
                    
                    const sortedColumns = [...defaultColumns, ...columnsData].sort(
                        (a, b) => a.order - b.order
                    );
                    
                    setColumns(sortedColumns);
                } catch (error) {
                    console.error('Error fetching columns:', error);
                }
            }
        };
        
        fetchColumns();
    }, [selectedProject, selectedTab, email]);


    const toggleColumn = (columnId) => {
        console.log('TablePage - Toggling column:', columnId, 'Tab:', selectedTab);
        
        setVisibleColumns(prev => {
          // Get the current visibility settings for the tab or initialize with empty object
          const currentTabSettings = prev[selectedTab] || {};
          
          // Log the current state for debugging
          console.log('Current visibility:', currentTabSettings[columnId]);
          console.log('Changing to:', !currentTabSettings[columnId]);
          
          // Create a new state object with the updated visibility
          const newState = {
            ...prev,
            [selectedTab]: {
              ...currentTabSettings,
              [columnId]: !currentTabSettings[columnId]
            }
          };
          
          console.log('New visibility state:', newState[selectedTab]);
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




    useEffect(() => {
        const getFirstProject = async () => {
            try {
                const allProjectNames = await getProjectNames(email);
                if (allProjectNames[0]) {
                    setProjectNames(allProjectNames);
                    setSelectedProject(allProjectNames[0]);
                    const allTabNames = await getTabNames(email, allProjectNames[0]);
                    if (allTabNames[0]) {
                        setTabNames(allTabNames);
                        setSelectedTab(allTabNames[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching project names or tabs in TablePage.")
            }
        }

        getFirstProject();
    }, [email]);

    useEffect(() => {
        setNewColumn(['']);
    }, [showColumnOptions]);

    return (
        <PageWrapper>
            {/* Tab Navigation */}
            <TabBar />

            {/* Table Management Buttons */}
            {selectedTab && (
    <div className="flex items-center justify-between pt-3 px-5 pb-3 dark:bg-neutral-950 w-full">
        <div className="flex items-center">
            <p className="text-2xl mr-6">{selectedTab} - Entries</p>
            <Button text="New Entry" onClick={() => setShowNewEntry(true)} className="mr-6" />
            <Button text="New Column" onClick={() => setShowColumnOptions(true)} className="mr-6"/>
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
        labels={columns.map(col => col.name)}
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
                ) : (
                    <DataViewer ref={dataViewerRef} />
                )}
            </div>

            {/* Pages */}
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
        onColumnOrderChange={(newOrder) => setColumnOrder(newOrder)}
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
