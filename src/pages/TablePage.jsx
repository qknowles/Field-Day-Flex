import React, { useEffect, useState } from 'react';
import Button from '../components/Button';
import TabBar from '../components/TabBar';
import PageWrapper from '../wrappers/PageWrapper';

/**
 * Quick and dirty way to get the Current Project to TopNav for ProjectSettings.jsx
 * @type {string}
 */
let currentProject = "null";
export function getCurrentProject() {
    return currentProject;
}

export default function TablePage({ Email }) {
    const [selectedTab, setSelectedTab] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    useEffect(() => {
        currentProject = selectedProject;
    }, [selectedProject]);

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
                {selectedTab || "Placeholder"}
            </div>
        </PageWrapper>
    );
}
