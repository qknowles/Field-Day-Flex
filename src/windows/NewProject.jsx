import React, { useState } from 'react';
import { DropdownFlex } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { projectExists, createProject } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';
import { useAtomValue } from 'jotai';
import { currentUserEmail } from '../utils/jotai.js';

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
            <div className="flex flex-col space-y-4">
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
                <DropdownFlex
                    options={contributors}
                    setOptions={setContributors}
                    label={'Contributors'}
                />
                <DropdownFlex
                    options={administrators}
                    setOptions={setAdministrators}
                    label={'Administrators'}
                />
            </div>
        </WindowWrapper>
    );
}
