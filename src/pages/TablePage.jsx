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
import { getProjectNames, getTabNames } from '../utils/firestore.js'


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

    <DataViewer columnOrder={columnOrder} />




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
                     <Button text="New Entry" onClick={() => setShowNewEntry(true)} className="mr-32" />
                     <Button text="New Column" onClick={() => setShowColumnOptions(true)} className="mr-6"/>
                     <Button text="Manage Columns" onClick={() => setShowManageColumns(true)} />
                 </div>
                 
                     {/* Export Icon */}
                     <button
                        onClick={handleExport}
                        className="p-2 text-white hover:bg-neutral-700 rounded ml-auto"
                        title="Export to CSV"
                    >
                        <ExportIcon className="h-6 w-6" />
                    </button>

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
                    OpenNewTab={() => setShowColumnOptions(false)}
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