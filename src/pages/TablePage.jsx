import React, { useEffect, useState } from 'react';
import TabBar from '../components/TabBar';
import DataViewer from '../components/DataViewer';
import PageWrapper from '../wrappers/PageWrapper';
import { LizardIcon } from '../assets/icons';
import NewProject from '../windows/NewProject';
import NewTab from '../windows/NewTab';

const NoProjectDisplay = () => (
    <div className="w-full text-center">
        <div className="pt-10">
            <h1 className="title">Field Day <br />
                <span style={{ fontFamily: '"Lucida Handwriting", cursive', fontSize: '0.7em', position: 'relative', top: '-0.3em' }}>
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
            <h1 className="title">Field Day <br />
                <span style={{ fontFamily: '"Lucida Handwriting", cursive', fontSize: '0.7em', position: 'relative', top: '-0.3em' }}>
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

/**
 * Quick and dirty way to get the Current Project to TopNav for ProjectSettings.jsx
 * @type {string}
 */
let currentProject = "null";
export function getCurrentProject() {
    return currentProject;
}

export default function TablePage({ Email }) {
    const [selectedProject, setSelectedProject] = useState('');
    useEffect(() => {
        currentProject = selectedProject;
    }, [selectedProject]);
    const [selectedTab, setSelectedTab] = useState('');
    const [showNewProject, setShowNewProject] = useState(false);
    const [showNewTab, setShowNewTab] = useState(false);

    return (
        <PageWrapper>
            {/* Tab Navigation */}
            <TabBar
                Email={Email}
                SelectedProject={selectedProject}
                SetSelectedProject={setSelectedProject}
                SelectedTab={selectedTab}
                SetSelectedTab={setSelectedTab}
                OnNewProject={() => setShowNewProject(true)}
                OnNewTab={() => setShowNewTab(true)}
            />

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

            {/* Modals */}
            {showNewProject && (
                <NewProject
                    CancelProject={() => setShowNewProject(false)}
                    OpenNewProject={(projectName) => {
                        setShowNewProject(false);
                        setSelectedProject(projectName);
                    }}
                    Email={Email}
                />
            )}
            {showNewTab && (
                <NewTab
                    CancelTab={() => setShowNewTab(false)}
                    OpenNewTab={(tabName) => {
                        setShowNewTab(false);
                        setSelectedTab(tabName);
                    }}
                    Email={Email}
                    SelectedProject={selectedProject}
                />
            )}
        </PageWrapper>
    );
}