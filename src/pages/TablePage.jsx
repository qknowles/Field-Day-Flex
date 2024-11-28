import React, { useState } from 'react';
import TabBar from '../components/TabBar';
import Table from '../components/Table';
import PageWrapper from '../wrappers/PageWrapper';
import { LizardIcon } from '../assets/icons';

const NoProjectDisplay = () => {
    return (
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
};

const NoTabsDisplay = () => {
    return (
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
};

export default function TablePage({ Email }) {
    const [selectedTab, setSelectedTab] = useState('');
    const [selectedProject, setSelectedProject] = useState('');

    return (
        <PageWrapper>
            <TabBar
                Email={Email}
                SelectedTab={selectedTab}
                SetSelectedTab={setSelectedTab}
                SelectedProject={selectedProject}
                SetSelectedProject={setSelectedProject}
            />
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
                    />
                )}
            </div>
        </PageWrapper>
    );
}