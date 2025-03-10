import React from 'react';
import { editMemberships } from '../utils/firestore';
import Button from '../components/Button';
import WindowWrapper from '../wrappers/WindowWrapper';
import { Type, notify } from '../components/Notifier';
import { useAtomValue, useAtom } from 'jotai';
import { currentUserEmail, allProjectNames } from '../utils/jotai.js';

export default function ManageMembership({ CancelMemberships, setCurrentWindow }) {
    const [projectNames, setProjectNames] = useAtom(allProjectNames);
    const email = useAtomValue(currentUserEmail);

    const handleLeaveProject = async (project) => {
        const success = await editMemberships(email, project);
        if (success) {
            notify(Type.success, `Left project: ${project}`);
            setProjectNames((prevProjectNames) => [
                ...(prevProjectNames || []).filter((p) => p !== project)
              ]);
            if (projectNames.length === 0) {
                setCurrentWindow('HomePage');
            }
        } else {
            notify(
                Type.error,
                'Could not leave project. Project owners cannot leave their projects.',
            );
        }
    };

    return (
        <WindowWrapper
            header="Project Memberships"
            onLeftButton={CancelMemberships}
            leftButtonText="Close"
        >
            <div className="flex flex-col space-y-4 p-4">
                {projectNames.length === 0 ? (
                    <p className="text-center">You are not a member of any projects</p>
                ) : (
                    projectNames.map((project) => (
                        <div
                            key={project}
                            className="flex justify-between items-center p-4 bg-white dark:bg-neutral-800 rounded-lg shadow"
                        >
                            <span className="text-lg">{project}</span>
                            <Button
                                text="Leave Project"
                                onClick={() => handleLeaveProject(project)}
                            />
                        </div>
                    ))
                )}
            </div>
        </WindowWrapper>
    );
}
