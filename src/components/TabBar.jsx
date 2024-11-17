import Tab from './Tab';
import React, { useEffect, useState } from 'react';
import { getTabNames, getProjectNames } from '../utils/firestore';
import Button from './Button';
import { ProjectField } from './FormFields';
import { Type, notify } from '../components/Notifier';
import NewProject from '../windows/NewProject';
import NewTab from '../windows/NewTab'

export default function TabBar({
    Email,
    SelectedTab,
    SetSelectedTab,
    SelectedProject,
    SetSelectedProject,
}) {
    const [showNewTab, setShowNewTab] = useState(false);
    const [showNewProject, setShowNewProject] = useState(false);

    const closeNewProject = () => setShowNewProject(false);
    const openNewProject = async (projectName) => {
        setShowNewProject(false);
        setProjectNames((prevProjectNames) => [...prevProjectNames, projectName]);
        SetSelectedProject(projectName);
    };
    

    const [projectNames, setProjectNames] = useState([]);
    const [tabNames, setTabNames] = useState([]);
    const [activeTabs, setActiveTabs] = useState({});

    const initializeTabs = async () => {
        const projects = await getProjectNames(Email);
        setProjectNames(projects);

        if (projects.length > 0) {
            const defaultProject = projects[0];
            SetSelectedProject(defaultProject);

            const tabs = await getTabNames(Email, defaultProject);
            setTabNames(tabs);

            if (tabs.length > 0) {
                const defaultTab = tabs[0];
                SetSelectedTab(defaultTab);
            }
        }
    };

    useEffect(() => {
        initializeTabs();
    }, [Email, SelectedProject]);

    useEffect(() => {
        const activeStatusMap = tabNames.reduce((map, tab) => {
            map[tab] = tab === SelectedTab;
            return map;
        }, {});
        setActiveTabs(activeStatusMap);
    }, [SelectedTab]);

    return (
        <>
            <div className="flex justify-between items-center overflow-auto dark:bg-neutral-700">
                <div className="flex pt-2 px-2">
                    {tabNames.map((tabName) => (
                        <Tab
                            key={tabName}
                            text={tabName}
                            active={activeTabs[tabName] || false}
                            onClick={() => SetSelectedTab(tabName)}
                        />
                    ))}
                    <Tab
                        key="add"
                        text="+"
                        active={false}
                        onClick={() => {
                            if (projectNames.length > 0) {
                                setShowNewTab(true);
                            } else {
                                notify(Type.error, 'Must create a project first.');
                            }
                        }}
                    />
                </div>
                <div className="flex pt-1 px-5 pb-1 space-x-6">
                    <Button text="New Project" onClick={() => setShowNewProject(true)} />
                    <ProjectField
                        projectNames={projectNames}
                        selectedProject={SelectedProject}
                        setSelectedProject={SetSelectedProject}
                        layout={'horizontal'}
                    />
                </div>
            </div>
            <div>
                {showNewTab && <NewTab />}
                {showNewProject && <NewProject CancelProject={closeNewProject} OpenNewProject={openNewProject} Email={Email} />}
            </div>
        </>
    );
}
