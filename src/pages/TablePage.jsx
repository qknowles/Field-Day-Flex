import React, { useState } from 'react';
import Button from '../components/Button';
import TabBar from '../components/TabBar';
import PageWrapper from '../wrappers/PageWrapper';
import { LizardIcon } from '../assets/icons';

const NoProjectDisplay = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-neutral-950">
      <LizardIcon className="h-32 w-32 text-asu-maroon rotate-45 mb-4" />
      
      <h1 className="text-3xl font-bold mb-2">
        Field Day
        <span 
          className="block text-2xl"
          style={{
            fontFamily: '"Lucida Handwriting", cursive'
          }}
        >
          Flex
        </span>
      </h1>
      
      <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md mt-4">
        Create a project or wait until you are added to one.
      </p>
    </div>
  );
};

const NoTabsDisplay = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-neutral-950">
      <LizardIcon className="h-32 w-32 text-asu-maroon rotate-45 mb-4" />
      
      <h1 className="text-3xl font-bold mb-2">
        Field Day
        <span 
          className="block text-2xl"
          style={{
            fontFamily: '"Lucida Handwriting", cursive'
          }}
        >
          Flex
        </span>
      </h1>
      
      <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md mt-4">
        Click the + tab to add your first study or wait to be invited.
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
            <div className="flex-grow">
                {!selectedProject ? (
                    <NoProjectDisplay />
                ) : !selectedTab ? (
                    <NoTabsDisplay />
                ) : (
                    selectedTab
                )}
            </div>
        </PageWrapper>
    );
}