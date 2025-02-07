import React, { useEffect, useState } from 'react';
import TabBar from '../components/TabBar';
import DataViewer from '../components/DataViewer';
import PageWrapper from '../wrappers/PageWrapper';
import { LizardIcon } from '../assets/icons';
import NewEntry from '../windows/NewEntry';
import Button from '../components/Button';
import ManageColumns from '../windows/MangeColumns';
import { useAtomValue } from 'jotai';
import { currentProjectName, currentTableName } from '../utils/jotai.js';

export default function TablePage() {
    const selectedProject = useAtomValue(currentProjectName);
    const selectedTab = useAtomValue(currentTableName);
    
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [showManageColumns, setShowManageColumns] = useState(false);
    const [showColumnOptions, setShowColumnOptions] = useState(false);
    const [newColumn, setNewColumn] = useState(['']);

    useEffect(() => {
        setNewColumn(['']);
    }, [showColumnOptions]);

    return (
        <PageWrapper>
            {/* Tab Navigation */}
            <TabBar />

            {/* Table Management Buttons */}
            {selectedTab && (
                <div className="flex items-center pt-3 px-5 pb-3 space-x-6 dark:bg-neutral-950">
                    <div className="flex items-center space-x-6 pr-32">
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
                    <DataViewer />
                )}
            </div>

            {/* Pages */}
            {showNewEntry && (
                <NewEntry
                    CloseNewEntry={() => setShowNewEntry(false)}
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
