import React, { useState } from 'react';
import Button from '../components/Button';
import TabBar from '../components/TabBar';
import PageWrapper from '../wrappers/PageWrapper';

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
                {selectedTab || "Placeholder"}
            </div>
        </PageWrapper>
    );
}
