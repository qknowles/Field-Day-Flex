import React, { useState } from 'react';
import { DropdownFlex } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { projectExists, createProject } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';
import { useAtomValue } from 'jotai';
import { currentUserEmail } from '../utils/jotai.js';
import InfoIcon from '../components/InfoIcon';

export default function NewProject({ CancelProject, OpenNewProject }) {

    const Email = useAtomValue(currentUserEmail);

    const [projectName, setProjectName] = useState('');
    const [contributors, setContributors] = useState([]);
    const [administrators, setAdministrators] = useState([]);

    const createClick = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const validContributors = contributors.filter((contrib) => contrib !== 'Add Here');
        const validAdministrators = administrators.filter((admin) => admin !== 'Add Here');

        const allEmailsValid =
            validContributors.every((email) => emailRegex.test(email)) &&
            validAdministrators.every((email) => emailRegex.test(email));

        if (!allEmailsValid) {
            notify(Type.error, 'One or more entries are not valid email addresses.');
            return;
        }

        const finalContributors = Array.from(new Set(validContributors));
        const finalAdministrators = Array.from(new Set(validAdministrators));

        const filteredContributors = finalContributors.filter(
            (email) => !finalAdministrators.includes(email),
        );

        const trimmedProjectName = projectName.trim();

        const projectAlreadyExists = await projectExists(trimmedProjectName);
        if (!projectAlreadyExists) {
            const projectCreated = await createProject(
                trimmedProjectName,
                Email,
                filteredContributors,
                finalAdministrators,
            );

            if (projectCreated) {
                notify(Type.success, `Created new project.`);
                OpenNewProject(trimmedProjectName);
                return;
            } else {
                notify(Type.error, 'Error creating project.');
                return;
            }
        } else {
            notify(Type.error, 'Project name already exists.');
        }
    };

    return (
        <WindowWrapper
            header="Create Project"
            onLeftButton={CancelProject}
            onRightButton={createClick}
            leftButtonText="Cancel"
            rightButtonText="Create"
        >
            <div className="mb-4">
                <div className="flex items-center mb-2">
                    <h3 className="text-lg font-medium">New Project</h3>
                    <InfoIcon 
                        text="Create a new project to organize your data. You will automatically be assigned as the owner of this project."
                        position="right"
                        className="ml-2"
                    />
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Enter a project name and optionally add contributors and administrators by email address</p>
            </div>
            <div className="flex flex-col space-y-4">
                <div className="flex items-center">
                    <InputLabel
                        label="Project Name"
                        layout="horizontal-single"
                        input={
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => {
                                    setProjectName(e.target.value);
                                }}
                            />
                        }
                    />
                    <InfoIcon 
                        text="Enter a unique name for your project. This name will be used to identify your project in the system."
                        position="right"
                        className="ml-2"
                    />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                        <h3 className="text-sm font-medium">Contributors</h3>
                        <InfoIcon 
                            text="Contributors can view and add data to the project, but cannot change project settings."
                            position="right"
                            className="ml-2"
                            size={14}
                        />
                    </div>
                    <DropdownFlex
                        options={contributors}
                        setOptions={setContributors}
                        label={'Contributors'}
                    />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                        <h3 className="text-sm font-medium">Administrators</h3>
                        <InfoIcon 
                            text="Administrators can manage project settings, add/remove users, and manage columns in addition to the contributor permissions."
                            position="right"
                            className="ml-2"
                            size={14}
                            width={300}
                        />
                    </div>
                    <DropdownFlex
                        options={administrators}
                        setOptions={setAdministrators}
                        label={'Administrators'}
                    />
                </div>
                <div className="mt-2 mb-2">
                    <div className="flex items-center">
                        <h3 className="text-sm font-medium">Email Address Format</h3>
                        <InfoIcon 
                            text="Enter valid email addresses in the format user@example.com. Click 'Add Here' to add a new email address."
                            position="right"
                            className="ml-2"
                            size={14}
                        />
                    </div>
                </div>
            </div>
        </WindowWrapper>
    );
}