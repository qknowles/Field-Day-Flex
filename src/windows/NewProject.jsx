import React, { useState } from 'react';
import { DropdownFlex } from '../components/FormFields';
import WindowWrapper from '../wrappers/WindowWrapper';
import InputLabel from '../components/InputLabel';
import { projectExists, createProject } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';

export default function NewProject({ CancelProject, OpenNewProject, Email }) {
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

        const finalContributors = Array.from(
            new Set([...validContributors, ...validAdministrators]),
        );

        const finalAdmonistrators = Array.from(
            new Set([...validAdministrators]),
        );

        const projectAlreadyExists = await projectExists(projectName);
        if (!projectAlreadyExists) {
            await createProject(projectName, Email, finalContributors, finalAdmonistrators);
            OpenNewProject(projectName);
            return;
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
                    layout={'horizontal-multiple'}
                    label={'Contributors'}
                />
                <DropdownFlex
                    options={administrators}
                    setOptions={setAdministrators}
                    layout={'horizontal-multiple'}
                    label={'Administrators'}
                />
            </div>
        </WindowWrapper>
    );
}
