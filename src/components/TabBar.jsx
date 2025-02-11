import Tab from './Tab';
import React, { useEffect, useState } from 'react';
import { getTabNames, getProjectNames } from '../utils/firestore';
import Button from './Button';
import { DropdownSelector } from './FormFields';
import { Type, notify } from '../components/Notifier';
import NewProject from '../windows/NewProject';
import NewTab from '../windows/NewTab';
import { useAtom, useAtomValue } from 'jotai';
import { currentUserEmail, allProjectNames, currentProjectName, allTableNames, currentTableName } from '../utils/jotai.js';

export let updateProjectName = null;

export default function TabBar() {
    const email = useAtomValue(currentUserEmail);
    const [selectedProject, setSelectedProject] = useAtom(currentProjectName);
    const [projects, setProjects] = useAtom(allProjectNames);
    const [selectedTab, setSelectedTab] = useAtom(currentTableName);
    const [tabNames, setTabNames] = useAtom(allTableNames);

    const [showNewTab, setShowNewTab] = useState(false);
    const [showNewProject, setShowNewProject] = useState(false);
    const [activeTabs, setActiveTabs] = useState({});


    const closeNewProject = () => setShowNewProject(false);

    const openNewProject = (projectName) => {
        setShowNewProject(false);
        setProjects((prevProjectNames) => [...prevProjectNames, projectName]);
        setSelectedProject(projectName);
    };

    const closeNewTab = () => setShowNewTab(false);

    const openNewTab = (tabName) => {
        setShowNewTab(false);
        setTabNames((prevTabNames) => [...prevTabNames, tabName]);
        setSelectedTab(tabName);
    };

    const initializeTabs = async () => {
        setProjects(await getProjectNames(email));

        if (projects.length > 0) {
            const defaultProject = selectedProject || projects[0];
            setSelectedProject(defaultProject);

            setTabNames(await getTabNames(email, selectedProject));

            if (tabNames.length > 0) {
                const defaultTab = tabNames[0];
                setSelectedTab(defaultTab);
            }
        }
    };

    // when we update project name in ProjectSettings.jsx we need to propagate that change here too
    updateProjectName = (newProjectName) => {
        setSelectedProject(newProjectName);
        if (!projects.includes(newProjectName)) {
            setProjects((prevProjectNames) => [...prevProjectNames, newProjectName]);
        }
    };

    useEffect(() => {
        initializeTabs();
    }, [email, selectedProject]);

    useEffect(() => {
        const activeStatusMap = tabNames.reduce((map, tab) => {
            map[tab] = tab === selectedTab;
            return map;
        }, {});
        setActiveTabs(activeStatusMap);
    }, [selectedTab]);

    return (
        <>
            <div className="flex justify-between items-center overflow-auto dark:bg-neutral-700">
                <div className="flex pt-2 px-2">
                    {tabNames.map((tabName) => (
                        <Tab
                            key={tabName}
                            text={tabName}
                            active={activeTabs[tabName] || false}
                            onClick={() => setSelectedTab(tabName)}
                        />
                    ))}
                    <Tab
                        key="add"
                        text="+"
                        active={false}
                        onClick={() => {
                            if (projects.length > 0) {
                                setShowNewTab(true);
                            } else {
                                notify(Type.error, 'Must create a project first.');
                            }
                        }}
                    />
                </div>
                <div className="flex pt-1 px-5 pb-1 space-x-6">
                    <Button text="New Project" onClick={() => setShowNewProject(true)} />
                    <DropdownSelector
                        label="Project"
                        options={projects}
                        selection={selectedProject}
                        setSelection={setSelectedProject}
                        layout={'horizontal'}
                    />
                </div>
            </div>
            <div>
                {showNewTab && (
                    <NewTab
                        CancelTab={closeNewTab}
                        OpenNewTab={openNewTab}
                        Email={email}
                        SelectedProject={selectedProject}
                    />
                )}
                {showNewProject && (
                    <NewProject
                        CancelProject={closeNewProject}
                        OpenNewProject={openNewProject}
                        Email={email}
                    />
                )}
            </div>
        </>
    );
}
