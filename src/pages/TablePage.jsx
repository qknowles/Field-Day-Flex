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
    const [showColumnOptions, setShowColumnOptions] = useState(false);
    const [newColumn, setNewColumn] = useState(['']);

    useEffect(() => {
        currentProject = selectedProject;
        setSelectedTab('');
    }, [selectedProject]);

    useEffect(() => {
        setNewColumn(['']);
    }, [showColumnOptions]);

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
                <div className="flex items-center pt-3 px-5 pb-3 space-x-6 dark:bg-neutral-950">
                    <div className='flex items-center space-x-6 pr-32'>
                        <p className="text-2xl">{selectedTab} - Entries</p>
                        <Button text="New Entry" onClick={() => setShowNewEntry(true)} />
                    </div>
                    <Button text="New Column" onClick={() => setShowColumnOptions(true)} />
                    <Button text="Manage Columns" onClick={() => setShowManageColumns(true)} />
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
            {showColumnOptions && (
                <ColumnOptions
                    ColumnNames={newColumn}
                    SetColumnNames={setNewColumn}
                    CancelColumnOptions={() => setShowColumnOptions(false)}
                    OpenNewTab={() => setShowColumnOptions(false)}
                    Email={Email}
                    SelectedProject={selectedProject}
                    TabName={selectedTab}
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
                    Email={Email}
                    SelectedProject={selectedProject}
                    TabName={selectedTab}
                />
            )}
        </PageWrapper>
    );
}