import React, { useState } from 'react';
import TabBar from '../components/TabBar';
import Table from '../components/Table';
import PageWrapper from '../wrappers/PageWrapper';
import { LizardIcon } from '../assets/icons';

// Import all window components
import NewProject from '../windows/NewProject';
import NewTab from '../windows/NewTab';
import NewEntry from '../windows/NewEntry';
import ManageProject from '../windows/ManageProject';
import AccountSettings from '../windows/AccountSettings';
import MembershipWindow from '../windows/MembershipWindow';

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

export default function TablePage({ Email }) {
    // Tab and project selection state
    const [selectedTab, setSelectedTab] = useState('');
    const [selectedProject, setSelectedProject] = useState('');

    // Window visibility states
    const [showNewProject, setShowNewProject] = useState(false);
    const [showNewTab, setShowNewTab] = useState(false);
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [showManageProject, setShowManageProject] = useState(false);
    const [showAccountSettings, setShowAccountSettings] = useState(false);
    const [showMemberships, setShowMemberships] = useState(false);

    // Window open/close handlers
    const handleNewProject = (projectName) => {
        setShowNewProject(false);
        setSelectedProject(projectName);
    };

    const handleNewTab = (tabName) => {
        setShowNewTab(false);
        setSelectedTab(tabName);
    };

    return (
        <PageWrapper>
            {/* TabBar Component */}
            <TabBar
                Email={Email}
                SelectedTab={selectedTab}
                SetSelectedTab={setSelectedTab}
                SelectedProject={selectedProject}
                SetSelectedProject={setSelectedProject}
                OnNewProject={() => setShowNewProject(true)}
                OnNewTab={() => setShowNewTab(true)}
            />
            
            {/* Main Content Area */}
            <div className="flex-grow bg-white dark:bg-neutral-950">
                {!selectedProject ? (
                    <NoProjectDisplay />
                ) : !selectedTab ? (
                    <NoTabsDisplay />
                ) : (
                    <Table 
                        Email={Email}
                        SelectedProject={selectedProject}
                        SelectedTab={selectedTab}
                        OnNewEntry={() => setShowNewEntry(true)}
                    />
                )}
            </div>

            {/* Window Overlays */}
            {showNewProject && (
                <NewProject 
                    CancelProject={() => setShowNewProject(false)}
                    OpenNewProject={handleNewProject}
                    Email={Email}
                />
            )}

            {showNewTab && (
                <NewTab
                    CancelTab={() => setShowNewTab(false)}
                    OpenNewTab={handleNewTab}
                    Email={Email}
                    SelectedProject={selectedProject}
                />
            )}

            {showNewEntry && (
                <NewEntry
                    CloseNewEntry={() => setShowNewEntry(false)}
                    ProjectName={selectedProject}
                    TabName={selectedTab}
                    Email={Email}
                />
            )}

            {showManageProject && (
                <ManageProject
                    CloseManageProject={() => setShowManageProject(false)}
                    ProjectName={selectedProject}
                    Email={Email}
                />
            )}

            {showAccountSettings && (
                <AccountSettings
                    CloseAccountSettings={() => setShowAccountSettings(false)}
                    emailProp={Email}
                />
            )}

            {showMemberships && (
                <MembershipWindow
                    CancelMemberships={() => setShowMemberships(false)}
                    Email={Email}
                />
            )}
        </PageWrapper>
    );
}