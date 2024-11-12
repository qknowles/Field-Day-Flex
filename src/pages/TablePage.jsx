import React, { useState } from 'react';
import Button from '../components/Button';
import TabBar from '../components/TabBar';
import PageWrapper from '../wrappers/PageWrapper';

export default function TablePage({ email }) {
    const [selectedTab, setSelectedTab] = useState('');
    const [selectedProject, setSelectedProject] = useState('');

    return (
        <PageWrapper>
            <TabBar
                email={email}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
            />
            <div className="flex-grow bg-white dark:bg-neutral-950">Placeholder</div>
        </PageWrapper>
    );
}
