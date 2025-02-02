import React, { useEffect, useState } from 'react';
import TabBar from '../components/TabBar';
import DataViewer from '../components/DataViewer';
import PageWrapper from '../wrappers/PageWrapper';
import { LizardIcon } from '../assets/icons';
import NewProject from '../windows/NewProject';
import NewTab from '../windows/NewTab';
import NewEntry from '../windows/NewEntry';
import ColumnOptions from '../windows/ColumnOptions';
import Button from '../components/Button';
import { getColumnsCollection } from '../utils/firestore';
import ManageColumns from '../windows/MangeColumns';
import ExportModal from '../modals/ExportModal';
import { ExportIcon } from '../assets/icons';




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

let currentProject = 'null';
export function getCurrentProject() {
    return currentProject;
}

export default function TablePage({ Email }) {
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedTab, setSelectedTab] = useState('');
    const [showNewProject, setShowNewProject] = useState(false);
    const [showNewTab, setShowNewTab] = useState(false);
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [showManageColumns, setShowManageColumns] = useState(false);
    const [columns, setColumns] = useState([]);
    const [showExportModal, setShowExportModal] = useState(false);


    useEffect(() => {
        currentProject = selectedProject;
        setSelectedTab('');
    }, [selectedProject]);

    useEffect(() => {
        const loadColumns = async () => {
            if (selectedProject && selectedTab) {
                const columnsData = await getColumnsCollection(selectedProject, selectedTab, Email);
                setColumns(columnsData);
            }
        };
        loadColumns();
    }, [selectedProject, selectedTab, Email]);

    return (
        <PageWrapper>
            {/* Tab Navigation */}
            <TabBar
                Email={Email}
                SelectedProject={selectedProject}
                SetSelectedProject={setSelectedProject}
                SelectedTab={selectedTab}
                SetSelectedTab={setSelectedTab}
            />

            {/* Table Management Buttons */}
            {selectedTab && (
               <div className="flex justify-between items-center pt-3 px-5 pb-3 dark:bg-neutral-950 w-full">
               <div className="flex space-x-4">
                   <Button text="New Entry" onClick={() => setShowNewEntry(true)} />
                   <Button text="Manage Columns" onClick={() => setShowManageColumns(true)} />
               </div>
           
               {/* Export Icon */}
               <button
                   onClick={() => setShowExportModal(true)}
                   className="p-2 text-white hover:bg-neutral-700 rounded ml-auto"
                   title="Export to CSV"
               >
                   <ExportIcon className="h-6 w-6" />
               </button>
           </div>
           
            )}

            {/* Content Area */}
            <div className="flex-grow bg-white dark:bg-neutral-950">
                {!selectedProject ? (
                    <NoProjectDisplay />
                ) : !selectedTab ? (
                    <NoTabsDisplay />
                ) : (
                    <DataViewer
                        Email={Email}
                        SelectedProject={selectedProject}
                        SelectedTab={selectedTab}
                    />
                )}
            </div>

            {/* Pages */}
            {showNewEntry && (
                <NewEntry
                    CloseNewEntry={() => setShowNewEntry(false)}
                    ProjectName={selectedProject}
                    TabName={selectedTab}
                    Email={Email}
                />
            )}
            {showManageColumns && (
                <ManageColumns
                    CloseManageColumns={() => setShowManageColumns(false)}
                    Email={Email}
                    SelectedProject={selectedProject}
                    TabName={selectedTab}
                />
            )}
            {showExportModal && (
               <ExportModal
                    showModal={showExportModal}
                    onCancel={() => setShowExportModal(false)}
               />
           )}

        </PageWrapper>
    );
}
